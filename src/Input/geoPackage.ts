import initSqlJs, { type SqlJsConfig } from "sql.js";
import MultiPolygon from "../geometry/MultiPolygon";
import Polygon from "../geometry/Polygon";
import Ring from "../geometry/Ring";
import Subdivision from "../geometry/Subdivision";
import type { Crs } from "./Crs";

/**
 * The result of reading a GeoPackage.
 */
export type GeoPackageResult = {
  data: Subdivision;
  /** The coordinate reference system declared in the file, if any. */
  crs?: Crs;
  /** Number of features dropped because they are not Polygon or MultiPolygon. */
  skipped: number;
};

/** Byte length of each GeoPackage envelope kind, indexed by envelope code. */
const envelopeSizes = [0, 32, 48, 48, 64];

/** OGC well-known-binary geometry codes, after removing the Z/M offset. */
const wkbPolygon = 3;
const wkbMultiPolygon = 6;

/**
 * Read a GeoPackage binary header.
 * @see https://www.geopackage.org/spec/#gpb_format
 */
const readHeader = (blob: Uint8Array) => {
  if (blob[0] !== 0x47 || blob[1] !== 0x50)
    throw new Error("not a GeoPackage geometry blob");
  const view = new DataView(blob.buffer, blob.byteOffset, blob.byteLength);
  const flags = blob[3];
  const littleEndian = (flags & 1) === 1;
  const envelopeSize = envelopeSizes[(flags >> 1) & 7] ?? 0;
  return {
    isEmpty: ((flags >> 4) & 1) === 1,
    srsId: view.getInt32(4, littleEndian),
    // The well-known binary follows the header and its optional envelope.
    wkbOffset: 8 + envelopeSize,
  };
};

/**
 * Read the polygons of a well-known-binary geometry.
 *
 * Returns one entry per polygon, each a list of rings, so a Polygon and a
 * MultiPolygon are handled uniformly. Anything else yields no polygons.
 */
const readPolygons = (blob: Uint8Array, offset: number) => {
  const view = new DataView(blob.buffer, blob.byteOffset, blob.byteLength);
  let at = offset;

  const readUInt32 = (littleEndian: boolean) => {
    const value = view.getUint32(at, littleEndian);
    at += 4;
    return value;
  };

  /** Read a geometry's byte order and type, splitting off the Z/M offset. */
  const readGeometryHeader = () => {
    const littleEndian = view.getUint8(at) === 1;
    at += 1;
    const code = readUInt32(littleEndian);
    // 1000/2000/3000 are added for Z, M and ZM variants respectively.
    const dimensions = code >= 3000 ? 4 : code >= 1000 ? 3 : 2;
    return { littleEndian, type: code % 1000, dimensions };
  };

  const readRings = (littleEndian: boolean, dimensions: number) => {
    const ringCount = readUInt32(littleEndian);
    const rings: [number, number][][] = [];
    for (let r = 0; r < ringCount; r++) {
      const pointCount = readUInt32(littleEndian);
      const positions: [number, number][] = [];
      for (let p = 0; p < pointCount; p++) {
        positions.push([
          view.getFloat64(at, littleEndian),
          view.getFloat64(at + 8, littleEndian),
        ]);
        // Skip any Z/M ordinates; the schematization is two-dimensional.
        at += 8 * dimensions;
      }
      if (positions.length > 0) rings.push(positions);
    }
    return rings;
  };

  const geometry = readGeometryHeader();
  if (geometry.type === wkbPolygon)
    return [readRings(geometry.littleEndian, geometry.dimensions)];

  if (geometry.type === wkbMultiPolygon) {
    const count = readUInt32(geometry.littleEndian);
    const polygons: [number, number][][][] = [];
    for (let i = 0; i < count; i++) {
      // Each part carries its own byte order and type.
      const part = readGeometryHeader();
      if (part.type !== wkbPolygon) return [];
      polygons.push(readRings(part.littleEndian, part.dimensions));
    }
    return polygons;
  }

  return [];
};

/**
 * Build a {@link Polygon}, re-wrapping each {@link Ring} so the counterclockwise
 * ordering enforced by {@link Ring.points} is what gets stored.
 */
const toPolygon = (rings: [number, number][][]) =>
  new Polygon(
    rings.map((positions) => {
      const ring = Ring.fromCoordinates(positions);
      return new Ring(ring.points.slice(0, -1));
    }),
  );

/**
 * Read a GeoPackage into a {@link Subdivision}.
 *
 * The geometry blobs are decoded directly into the geometry classes, so the
 * file's coordinate reference system survives instead of being flattened to
 * the WGS84 that GeoJSON mandates.
 * @param bytes the contents of a `.gpkg` file
 * @param config passed to sql.js, notably `locateFile` for its wasm
 * @returns the subdivision, its CRS, and the number of non-areal features dropped
 */
export const geoPackageToGeometry = async (
  bytes: Uint8Array,
  config?: SqlJsConfig,
): Promise<GeoPackageResult> => {
  const SQL = await initSqlJs(config);
  const db = new SQL.Database(bytes);

  try {
    const [layer] = db.exec(
      `SELECT g.table_name, g.column_name, s.organization,
              s.organization_coordsys_id, s.srs_name, s.definition
       FROM gpkg_geometry_columns g
       JOIN gpkg_contents c ON c.table_name = g.table_name
       LEFT JOIN gpkg_spatial_ref_sys s ON s.srs_id = g.srs_id
       WHERE c.data_type = 'features'`,
    );
    if (!layer?.values.length)
      throw new Error("no feature layer found in GeoPackage");

    const [table, column, organization, code, name, wkt] = layer.values[0] as [
      string,
      string,
      string | null,
      number | null,
      string | null,
      string | null,
    ];

    // 'NONE' is what the format uses for its two placeholder systems.
    const crs: Crs | undefined =
      organization && organization !== "NONE"
        ? {
            org: organization,
            code: code ?? undefined,
            name: name ?? undefined,
            wkt: wkt ?? undefined,
          }
        : undefined;

    const [rows] = db.exec(`SELECT "${column}" FROM "${table}"`);

    let skipped = 0;
    const multiPolygons: MultiPolygon[] = [];
    for (const [value] of rows?.values ?? []) {
      const blob = value as Uint8Array | null;
      if (!blob) {
        skipped++;
        continue;
      }
      const { isEmpty, wkbOffset } = readHeader(blob);
      const polygons = isEmpty ? [] : readPolygons(blob, wkbOffset);
      if (polygons.length === 0) {
        skipped++;
        continue;
      }
      multiPolygons.push(
        new MultiPolygon(
          polygons.map(toPolygon),
          multiPolygons.length.toString(),
        ),
      );
    }

    return { data: new Subdivision(multiPolygons), crs, skipped };
  } finally {
    db.close();
  }
};
