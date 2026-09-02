import Subdivision from "@/src/geometry/Subdivision";
import { flatGeobufToGeometry } from "@/src/Input/flatGeobuf";
import Input from "@/src/Input/Input";
import fs from "fs";
import * as geojson from "geojson";
import path from "path";
import { describe, expect, test } from "vitest";

const fgbDir = path.resolve("test/data/fgb");

const readFgb = (name: string) =>
  new Uint8Array(fs.readFileSync(path.join(fgbDir, name)));

const readGeoJSON = (filePath: string) =>
  JSON.parse(fs.readFileSync(filePath, "utf-8")) as geojson.FeatureCollection<
    geojson.Polygon | geojson.MultiPolygon
  >;

/** All positions of a subdivision, flattened. */
const positionsOf = (subdivision: Subdivision) =>
  subdivision.multiPolygons.flatMap((multiPolygon) =>
    multiPolygon.polygons.flatMap((polygon) =>
      polygon.rings.flatMap((ring) => ring.points.map((point) => point.xy)),
    ),
  );

/** All positions as a sorted list of keys, for order-independent comparison. */
const sortedPositionKeys = (subdivision: Subdivision) =>
  positionsOf(subdivision)
    .map(([x, y]) => `${x.toFixed(9)},${y.toFixed(9)}`)
    .sort();

describe("Reading a FlatGeobuf file", () => {
  test("parses a simple polygon into a Subdivision.", async () => {
    const { data, skipped } = await flatGeobufToGeometry(readFgb("square.fgb"));

    expect(skipped).toBe(0);
    expect(data.multiPolygons.length).toBe(1);
    expect(data.multiPolygons[0].polygons.length).toBe(1);
    expect(data.multiPolygons[0].polygons[0].rings.length).toBe(1);
    expect(data.vertexCount).toBe(4);
  });

  test("preserves the CRS declared in the header.", async () => {
    const { crs } = await flatGeobufToGeometry(readFgb("square.fgb"));

    expect(crs?.org).toBe("EPSG");
    expect(crs?.code).toBe(4326);
  });

  test("reads a file mixing Polygon and MultiPolygon features.", async () => {
    const { data, skipped } = await flatGeobufToGeometry(
      readFgb("AUT_adm1-simple.fgb"),
    );

    expect(skipped).toBe(0);
    expect(data.multiPolygons.length).toBe(9);
    // One feature is a genuine MultiPolygon, whose coordinates live in `parts`
    // rather than in the geometry's own `xy` buffer.
    expect(data.multiPolygons.filter((d) => d.polygons.length > 1).length).toBe(
      1,
    );
  });

  test("keeps projected coordinates unprojected.", async () => {
    const { data, crs } = await flatGeobufToGeometry(
      readFgb("AUT_adm1-31287.fgb"),
    );

    expect(crs?.code).toBe(31287);
    expect(crs?.name).toBe("MGI / Austria Lambert");
    // Austria Lambert is in metres; WGS84 would put these below 90.
    const [x, y] = positionsOf(data)[0];
    expect(x).toBeGreaterThan(100_000);
    expect(y).toBeGreaterThan(100_000);
  });

  test("carries feature properties through.", async () => {
    const { data } = await flatGeobufToGeometry(readFgb("AUT_adm1-simple.fgb"));

    expect(data.multiPolygons[0].properties?.NAME_0).toBe("Austria");
  });
});

describe("A FlatGeobuf file and its GeoJSON source", () => {
  const cases = [
    ["square.fgb", "test/data/shapes/square.json"],
    ["AUT_adm1-simple.fgb", "test/data/geodata/AUT_adm1-simple.json"],
  ] as const;

  test.each(cases)(
    "%s describes the same geometry as %s.",
    async (fgbName, geoJsonPath) => {
      const { data } = await flatGeobufToGeometry(readFgb(fgbName));
      const viaGeoJSON = Input.fromGeoJSON(readGeoJSON(geoJsonPath)).data;

      expect(data.vertexCount).toBe(viaGeoJSON.vertexCount);
      // Compared as a set: FlatGeobuf packs features into a Hilbert R-tree, so
      // they come back in spatial rather than source order (see below).
      expect(sortedPositionKeys(data)).toEqual(sortedPositionKeys(viaGeoJSON));
    },
  );

  test("orders features spatially rather than as the source file did.", async () => {
    const { data } = await flatGeobufToGeometry(readFgb("AUT_adm1-simple.fgb"));
    const viaGeoJSON = Input.fromGeoJSON(
      readGeoJSON("test/data/geodata/AUT_adm1-simple.json"),
    ).data;

    const names = (subdivision: Subdivision) =>
      subdivision.multiPolygons.map((d) => d.properties?.NAME_1);

    // The same features, in a different order — so `MultiPolygon.id`, which is
    // assigned from the position in the file, does not line up between the two.
    expect(names(data)).not.toEqual(names(viaGeoJSON));
    expect([...names(data)].sort()).toEqual([...names(viaGeoJSON)].sort());
  });

  test.each(cases)(
    "%s builds a Dcel matching the one built from %s.",
    async (fgbName, geoJsonPath) => {
      const fromFgb = (
        await Input.fromFlatGeobuf(fgbName, readFgb(fgbName))
      ).getDcel();
      const fromGeoJson = Input.fromGeoJSON(readGeoJSON(geoJsonPath)).getDcel();

      expect(fromFgb.vertices.size).toBe(fromGeoJson.vertices.size);
      expect(fromFgb.halfEdges.size).toBe(fromGeoJson.halfEdges.size);
      expect(fromFgb.getBoundedFaces().length).toBe(
        fromGeoJson.getBoundedFaces().length,
      );
      expect(fromFgb.getArea()).toBeCloseTo(fromGeoJson.getArea(), 10);
    },
  );
});

describe("An Input from a FlatGeobuf file", () => {
  test("records the file name, format and CRS.", async () => {
    const input = await Input.fromFlatGeobuf(
      "AUT_adm1-31287.fgb",
      readFgb("AUT_adm1-31287.fgb"),
    );

    expect(input.name).toBe("AUT_adm1-31287.fgb");
    expect(input.format).toBe("fgb");
    expect(input.crs?.code).toBe(31287);
  });

  test("defaults a GeoJSON input to WGS84.", () => {
    const input = Input.fromGeoJSON(
      readGeoJSON("test/data/shapes/square.json"),
      "square.json",
    );

    expect(input.name).toBe("square.json");
    expect(input.crs?.code).toBe(4326);
  });
});
