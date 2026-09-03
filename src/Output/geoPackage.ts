import initSqlJs, { type SqlJsConfig, type SqlValue } from "sql.js";
import type MultiPolygon from "../geometry/MultiPolygon";
import type Subdivision from "../geometry/Subdivision";
import type { Crs } from "../Input/Crs";
import BoundingBox from "../helpers/BoundingBox";
import { toWoundRings } from "./rings";

export type GeoPackageOptions = {
  /** The CRS the coordinates are defined in, written to `gpkg_spatial_ref_sys`. */
  crs?: Crs;
  /** Name of the feature table, also used as the layer's identifier. */
  layerName?: string;
  /** Passed to sql.js, notably `locateFile` for its wasm. */
  config?: SqlJsConfig;
};

/** OGC well-known-binary geometry codes. */
const wkbPolygon = 3;
const wkbMultiPolygon = 6;

/** `GPKG` in ASCII, the SQLite `application_id` of a GeoPackage. */
const applicationId = 0x47504b47;
/** GeoPackage 1.2, written into SQLite's `user_version`. */
const userVersion = 10200;

/** The srs_id used when the data carries no CRS: "undefined cartesian". */
const undefinedCartesianSrsId = -1;

/**
 * A growable little-endian byte writer, just enough for well-known binary.
 */
const createWriter = () => {
  let buffer = new ArrayBuffer(1024);
  let view = new DataView(buffer);
  let at = 0;

  const ensure = (bytes: number) => {
    if (at + bytes <= buffer.byteLength) return;
    const grown = new ArrayBuffer(Math.max(buffer.byteLength * 2, at + bytes));
    new Uint8Array(grown).set(new Uint8Array(buffer));
    buffer = grown;
    view = new DataView(buffer);
  };

  return {
    uint8: (value: number) => {
      ensure(1);
      view.setUint8(at, value);
      at += 1;
    },
    int32: (value: number) => {
      ensure(4);
      view.setInt32(at, value, true);
      at += 4;
    },
    uint32: (value: number) => {
      ensure(4);
      view.setUint32(at, value, true);
      at += 4;
    },
    float64: (value: number) => {
      ensure(8);
      view.setFloat64(at, value, true);
      at += 8;
    },
    toBytes: () => new Uint8Array(buffer.slice(0, at)),
  };
};

type Writer = ReturnType<typeof createWriter>;

/** Write a multipolygon as little-endian well-known binary. */
const writeWkb = (writer: Writer, multiPolygon: MultiPolygon) => {
  writer.uint8(1);
  writer.uint32(wkbMultiPolygon);
  writer.uint32(multiPolygon.polygons.length);
  for (const polygon of multiPolygon.polygons) {
    // Each part of a multipolygon carries its own byte order and type.
    writer.uint8(1);
    writer.uint32(wkbPolygon);
    const rings = toWoundRings(polygon);
    writer.uint32(rings.length);
    for (const ring of rings) {
      writer.uint32(ring.length);
      for (const [x, y] of ring) {
        writer.float64(x);
        writer.float64(y);
      }
    }
  }
};

/**
 * The extent of a multipolygon, as the `[minX, maxX, minY, maxY]` the
 * GeoPackage envelope expects — the same order {@link BoundingBox} reduces to.
 */
const extentOf = (multiPolygon: MultiPolygon) =>
  BoundingBox.fromCoordinates(
    multiPolygon.polygons.flatMap(toWoundRings).flat(),
  );

/**
 * Wrap a multipolygon in a GeoPackage geometry blob: the `GP` header, an
 * envelope, then the well-known binary.
 * @see https://www.geopackage.org/spec/#gpb_format
 */
const toGeometryBlob = (multiPolygon: MultiPolygon, srsId: number) => {
  const writer = createWriter();
  writer.uint8(0x47);
  writer.uint8(0x50);
  writer.uint8(0);
  // Version 0, little endian (bit 0), with an xy envelope (bits 1-3 = 1).
  writer.uint8(0b0000_0011);
  writer.int32(srsId);
  extentOf(multiPolygon).forEach(writer.float64);
  writeWkb(writer, multiPolygon);
  return writer.toBytes();
};

/** The SQLite type of a column, inferred from the values it has to hold. */
const columnType = (values: unknown[]) => {
  const present = values.filter(
    (value) => value !== null && value !== undefined,
  );
  if (present.length === 0) return "TEXT";
  if (present.every((value) => typeof value === "number"))
    return present.every((value) => Number.isInteger(value))
      ? "INTEGER"
      : "REAL";
  if (present.every((value) => typeof value === "boolean")) return "INTEGER";
  return "TEXT";
};

/** Reduce a property value to something SQLite can store. */
const toSqlValue = (value: unknown): SqlValue => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" || typeof value === "string") return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  return JSON.stringify(value);
};

/** Quote an identifier, doubling any embedded quote. */
const quote = (name: string) => `"${name.replaceAll('"', '""')}"`;

/**
 * The attribute columns of the feature table: the union of the multipolygons'
 * property keys, in the order they are first seen.
 */
const attributeColumns = (multiPolygons: MultiPolygon[]) => {
  const names = [
    ...new Set(
      multiPolygons.flatMap((multiPolygon) =>
        Object.keys(multiPolygon.properties ?? {}),
      ),
    ),
  ].filter((name) => name.length > 0 && name !== "fid" && name !== "geom");
  return names.map((name) => ({
    name,
    type: columnType(
      multiPolygons.map((multiPolygon) => multiPolygon.properties?.[name]),
    ),
  }));
};

/**
 * Write a {@link Subdivision} as a GeoPackage.
 *
 * The geometry is written as well-known binary in the source data's own
 * coordinates, and the CRS is declared in `gpkg_spatial_ref_sys`, so a
 * projected schematization stays projected.
 * @param subdivision the subdivision to write
 * @param options the CRS to declare, the layer's name, and the sql.js config
 * @returns the contents of a `.gpkg` file
 */
export const subdivisionToGeoPackage = async (
  subdivision: Subdivision,
  { crs, layerName = "schematization", config }: GeoPackageOptions = {},
): Promise<Uint8Array> => {
  const SQL = await initSqlJs(config);
  const db = new SQL.Database();

  try {
    const srsId = crs?.code ?? undefinedCartesianSrsId;
    const columns = attributeColumns(subdivision.multiPolygons);

    db.run(`
      PRAGMA application_id = ${applicationId};
      PRAGMA user_version = ${userVersion};

      CREATE TABLE gpkg_spatial_ref_sys (
        srs_name TEXT NOT NULL,
        srs_id INTEGER NOT NULL PRIMARY KEY,
        organization TEXT NOT NULL,
        organization_coordsys_id INTEGER NOT NULL,
        definition TEXT NOT NULL,
        description TEXT
      );

      CREATE TABLE gpkg_contents (
        table_name TEXT NOT NULL PRIMARY KEY,
        data_type TEXT NOT NULL,
        identifier TEXT UNIQUE,
        description TEXT DEFAULT '',
        last_change DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        min_x DOUBLE, min_y DOUBLE, max_x DOUBLE, max_y DOUBLE,
        srs_id INTEGER,
        CONSTRAINT fk_gc_r_srs_id FOREIGN KEY (srs_id)
          REFERENCES gpkg_spatial_ref_sys(srs_id)
      );

      CREATE TABLE gpkg_geometry_columns (
        table_name TEXT NOT NULL,
        column_name TEXT NOT NULL,
        geometry_type_name TEXT NOT NULL,
        srs_id INTEGER NOT NULL,
        z TINYINT NOT NULL,
        m TINYINT NOT NULL,
        CONSTRAINT pk_geom_cols PRIMARY KEY (table_name, column_name),
        CONSTRAINT uk_gc_table_name UNIQUE (table_name),
        CONSTRAINT fk_gc_tn FOREIGN KEY (table_name)
          REFERENCES gpkg_contents(table_name),
        CONSTRAINT fk_gc_srs FOREIGN KEY (srs_id)
          REFERENCES gpkg_spatial_ref_sys (srs_id)
      );
    `);

    // The two placeholder systems are required by the spec, whatever the data's CRS.
    const insertSrs = db.prepare(
      `INSERT INTO gpkg_spatial_ref_sys
       (srs_name, srs_id, organization, organization_coordsys_id, definition)
       VALUES (?, ?, ?, ?, ?)`,
    );
    insertSrs.run(["Undefined cartesian SRS", -1, "NONE", -1, "undefined"]);
    insertSrs.run(["Undefined geographic SRS", 0, "NONE", 0, "undefined"]);
    if (crs?.code !== undefined && crs.code !== -1 && crs.code !== 0)
      insertSrs.run([
        crs.name ?? `${crs.org ?? "EPSG"}:${crs.code}`,
        crs.code,
        crs.org ?? "EPSG",
        crs.code,
        crs.wkt ?? "undefined",
      ]);
    insertSrs.free();

    const definitions = [
      "fid INTEGER PRIMARY KEY AUTOINCREMENT",
      "geom MULTIPOLYGON",
      ...columns.map(({ name, type }) => `${quote(name)} ${type}`),
    ];
    db.run(`CREATE TABLE ${quote(layerName)} (${definitions.join(", ")})`);

    const { xMin, xMax, yMin, yMax } = subdivision.getBbox();
    db.run(
      `INSERT INTO gpkg_contents
       (table_name, data_type, identifier, min_x, min_y, max_x, max_y, srs_id)
       VALUES (?, 'features', ?, ?, ?, ?, ?, ?)`,
      [layerName, layerName, xMin, yMin, xMax, yMax, srsId],
    );
    db.run(
      `INSERT INTO gpkg_geometry_columns
       (table_name, column_name, geometry_type_name, srs_id, z, m)
       VALUES (?, 'geom', 'MULTIPOLYGON', ?, 0, 0)`,
      [layerName, srsId],
    );

    const insertFeature = db.prepare(
      `INSERT INTO ${quote(layerName)}
       (geom${columns.map(({ name }) => `, ${quote(name)}`).join("")})
       VALUES (?${columns.map(() => ", ?").join("")})`,
    );
    for (const multiPolygon of subdivision.multiPolygons)
      insertFeature.run([
        toGeometryBlob(multiPolygon, srsId),
        ...columns.map(({ name }) =>
          toSqlValue(multiPolygon.properties?.[name]),
        ),
      ]);
    insertFeature.free();

    return db.export();
  } finally {
    db.close();
  }
};
