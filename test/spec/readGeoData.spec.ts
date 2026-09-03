import { readGeoData } from "@/src/Input/readGeoData";
import fs from "fs";
import path from "path";
import { describe, expect, test } from "vitest";

const read = (file: string, options?: Parameters<typeof readGeoData>[2]) =>
  readGeoData(
    path.basename(file),
    new Uint8Array(fs.readFileSync(file)),
    options,
  );

/** A collection mixing a polygon with features the schematization cannot use. */
const mixed = new TextEncoder().encode(
  JSON.stringify({
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [0, 0],
              [1, 0],
              [1, 1],
              [0, 1],
              [0, 0],
            ],
          ],
        },
      },
      {
        type: "Feature",
        properties: {},
        geometry: { type: "Point", coordinates: [5, 5] },
      },
      {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: [
            [0, 0],
            [1, 1],
          ],
        },
      },
    ],
  }),
);

describe("Reading geodata", () => {
  test("dispatches on the extension, whatever the format.", async () => {
    for (const file of [
      "test/data/gpkg/square.gpkg",
      "test/data/fgb/square.fgb",
      "test/data/shapes/square.json",
    ]) {
      const result = await read(file);
      expect(result.ok, file).toBe(true);
      if (result.ok) expect(result.input.data.multiPolygons.length).toBe(1);
    }
  });

  test("keeps the CRS a binary format declares.", async () => {
    const result = await read("test/data/gpkg/AUT_adm1-31287.gpkg");

    expect(result.ok && result.input.crs?.code).toBe(31287);
  });

  test("keeps a mixed collection's areal features and counts the rest.", async () => {
    const result = await readGeoData("mixed.geojson", mixed);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.input.data.multiPolygons.length).toBe(1);
    expect(result.skipped).toBe(2);
  });

  test("rejects a file with no areal features at all.", async () => {
    const result = await read("test/data/invalid/linestrings.json");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/No polygonal features/);
  });

  test("rejects an unknown extension.", async () => {
    const result = await readGeoData("data.shp", new Uint8Array());

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/Unsupported file type/);
  });

  describe("with a vertex limit", () => {
    // The limit belongs to the consumer, not to the encoding, so it has to bite
    // whatever the file happens to be.
    test.each([
      ["test/data/gpkg/AUT_adm1-simple.gpkg"],
      ["test/data/fgb/AUT_adm1-simple.fgb"],
      ["test/data/geodata/AUT_adm1-simple.json"],
    ])("applies to %s.", async (file) => {
      const result = await read(file, { maxVertexCount: 3 });

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toMatch(/Too detailed/);
    });

    test("passes data within the limit.", async () => {
      const result = await read("test/data/shapes/square.json", {
        maxVertexCount: 4,
      });

      expect(result.ok).toBe(true);
    });

    test("is unbounded when no limit is given.", async () => {
      const result = await read("test/data/geodata/AUT_adm1-simple.json");

      expect(result.ok).toBe(true);
    });
  });
});
