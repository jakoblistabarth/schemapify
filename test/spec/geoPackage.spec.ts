import Subdivision from "@/src/geometry/Subdivision";
import { geoPackageToGeometry } from "@/src/Input/geoPackage";
import Input from "@/src/Input/Input";
import fs from "fs";
import * as geojson from "geojson";
import path from "path";
import { describe, expect, test } from "vitest";

const readGpkg = (name: string) =>
  new Uint8Array(fs.readFileSync(path.join("test/data/gpkg", name)));

const readGeoJSON = (filePath: string) =>
  JSON.parse(fs.readFileSync(filePath, "utf-8")) as geojson.FeatureCollection<
    geojson.Polygon | geojson.MultiPolygon
  >;

/** All positions as sorted keys, for order-independent comparison. */
const sortedPositionKeys = (subdivision: Subdivision) =>
  subdivision.multiPolygons
    .flatMap((multiPolygon) =>
      multiPolygon.polygons.flatMap((polygon) =>
        polygon.rings.flatMap((ring) => ring.points.map((point) => point.xy)),
      ),
    )
    .map(([x, y]) => `${x.toFixed(9)},${y.toFixed(9)}`)
    .sort();

describe("Reading a GeoPackage", () => {
  test("parses a simple polygon into a Subdivision.", async () => {
    const { data, skipped } = await geoPackageToGeometry(
      readGpkg("square.gpkg"),
    );

    expect(skipped).toBe(0);
    expect(data.multiPolygons.length).toBe(1);
    expect(data.multiPolygons[0].polygons[0].rings.length).toBe(1);
    expect(data.vertexCount).toBe(4);
  });

  test("preserves the CRS declared in the file.", async () => {
    const { crs } = await geoPackageToGeometry(readGpkg("square.gpkg"));

    expect(crs?.org).toBe("EPSG");
    expect(crs?.code).toBe(4326);
    // The WKT is what proj4 consumes, so it has to survive.
    expect(crs?.wkt).toMatch(/^GEOGCS/);
  });

  test("keeps projected coordinates unprojected.", async () => {
    const { data, crs } = await geoPackageToGeometry(
      readGpkg("AUT_adm1-31287.gpkg"),
    );

    expect(crs?.code).toBe(31287);
    expect(crs?.wkt).toMatch(/^PROJCS/);
    // Austria Lambert is in metres; WGS84 would put these below 90.
    const [x, y] = data.multiPolygons[0].polygons[0].rings[0].points[0].xy;
    expect(x).toBeGreaterThan(100_000);
    expect(y).toBeGreaterThan(100_000);
  });

  test("reads a file mixing Polygon and MultiPolygon features.", async () => {
    const { data, skipped } = await geoPackageToGeometry(
      readGpkg("AUT_adm1-simple.gpkg"),
    );

    expect(skipped).toBe(0);
    expect(data.multiPolygons.length).toBe(9);
    expect(data.multiPolygons.filter((d) => d.polygons.length > 1).length).toBe(
      1,
    );
  });

  test("rejects a file that is not a GeoPackage.", async () => {
    await expect(
      geoPackageToGeometry(new Uint8Array([1, 2, 3, 4])),
    ).rejects.toThrow();
  });
});

describe("A GeoPackage and its GeoJSON source", () => {
  const cases = [
    ["square.gpkg", "test/data/shapes/square.json"],
    ["AUT_adm1-simple.gpkg", "test/data/geodata/AUT_adm1-simple.json"],
  ] as const;

  test.each(cases)(
    "%s describes the same geometry as %s.",
    async (gpkgName, geoJsonPath) => {
      const { data } = await geoPackageToGeometry(readGpkg(gpkgName));
      const viaGeoJSON = Input.fromGeoJSON(readGeoJSON(geoJsonPath)).data;

      expect(data.vertexCount).toBe(viaGeoJSON.vertexCount);
      expect(sortedPositionKeys(data)).toEqual(sortedPositionKeys(viaGeoJSON));
    },
  );

  test.each(cases)(
    "%s builds a Dcel matching the one built from %s.",
    async (gpkgName, geoJsonPath) => {
      const fromGpkg = (
        await Input.fromGeoPackage(gpkgName, readGpkg(gpkgName))
      ).getDcel();
      const fromGeoJson = Input.fromGeoJSON(readGeoJSON(geoJsonPath)).getDcel();

      expect(fromGpkg.vertices.size).toBe(fromGeoJson.vertices.size);
      expect(fromGpkg.halfEdges.size).toBe(fromGeoJson.halfEdges.size);
      expect(fromGpkg.getBoundedFaces().length).toBe(
        fromGeoJson.getBoundedFaces().length,
      );
      expect(fromGpkg.getArea()).toBeCloseTo(fromGeoJson.getArea(), 10);
    },
  );
});

describe("A GeoPackage and the equivalent FlatGeobuf", () => {
  test("produce the same geometry.", async () => {
    const gpkg = await geoPackageToGeometry(readGpkg("AUT_adm1-31287.gpkg"));
    const { flatGeobufToGeometry } = await import("@/src/Input/flatGeobuf");
    const fgb = await flatGeobufToGeometry(
      new Uint8Array(fs.readFileSync("test/data/fgb/AUT_adm1-31287.fgb")),
    );

    expect(gpkg.crs?.code).toBe(fgb.crs?.code);
    expect(gpkg.data.vertexCount).toBe(fgb.data.vertexCount);
    expect(sortedPositionKeys(gpkg.data)).toEqual(sortedPositionKeys(fgb.data));
  });
});

describe("An Input from a GeoPackage", () => {
  test("records the file name, format and CRS.", async () => {
    const input = await Input.fromGeoPackage(
      "AUT_adm1-31287.gpkg",
      readGpkg("AUT_adm1-31287.gpkg"),
    );

    expect(input.name).toBe("AUT_adm1-31287.gpkg");
    expect(input.format).toBe("gpkg");
    expect(input.crs?.code).toBe(31287);
  });
});
