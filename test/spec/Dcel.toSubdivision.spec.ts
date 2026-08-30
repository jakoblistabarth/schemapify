import Dcel from "@/src/Dcel/Dcel";
import Input from "@/src/Input/Input";
import Subdivision from "@/src/geometry/Subdivision";
import fs from "fs";
import * as geojson from "geojson";
import { describe, expect, test } from "vitest";

/** The ring sizes of every polygon, as a comparable shape description. */
const ringSizes = (subdivision: Subdivision) =>
  subdivision.multiPolygons.map((multiPolygon) =>
    multiPolygon.polygons
      .map((polygon) =>
        polygon.rings.map((ring) => ring.points.length).join("+"),
      )
      .join("|"),
  );

const read = (path: string) =>
  Input.fromGeoJSON(
    JSON.parse(fs.readFileSync(path, "utf-8")) as geojson.FeatureCollection<
      geojson.Polygon | geojson.MultiPolygon
    >,
  );

describe("A Subdivision converted to a Dcel and back", () => {
  test.each([
    "test/data/geodata/AUT_adm1-simple.json",
    "test/data/geodata/AUT_adm1.json",
    "test/data/geodata/ne_50m_europe_mapunits-s20.json",
    "test/data/geodata/ne_50m_africa_admin0-s20.json",
    "test/data/shapes/2plgn-islands-holes.json",
    "test/data/shapes/3plgn-complex.json",
  ])("keeps the rings of %s.", { timeout: 60_000 }, (path) => {
    const input = read(path);

    expect(ringSizes(input.data.toDcel().toSubdivision())).toEqual(
      ringSizes(input.data),
    );
  });

  test("keeps an enclave as a hole rather than a separate polygon.", () => {
    // Italy contains San Marino and Vatican City, which are also features in
    // their own right. Their rings therefore already have a face by the time
    // Italy is processed, which used to skip the hole bookkeeping entirely.
    const input = read("test/data/geodata/ne_50m_europe_mapunits-s20.json");
    const italy = input.data.multiPolygons.findIndex(
      (d) => d.properties?.NAME === "Italy",
    );
    expect(italy).toBeGreaterThan(-1);

    const before = input.data.multiPolygons[italy];
    const after = input.data.toDcel().toSubdivision().multiPolygons[italy];

    // The mainland keeps its two holes instead of shedding them.
    expect(after.polygons.length).toBe(before.polygons.length);
    expect(after.polygons.map((d) => d.rings.length).sort()).toEqual(
      before.polygons.map((d) => d.rings.length).sort(),
    );
  });
});

describe("A Dcel with degenerate inner rings", () => {
  const squareWithHole = () =>
    Dcel.fromCoordinates([
      [
        [
          [
            [0, 0],
            [10, 0],
            [10, 10],
            [0, 10],
          ],
          [
            [3, 3],
            [3, 7],
            [7, 7],
            [7, 3],
          ],
        ],
      ],
    ]);

  test("returns the hole of a square with one.", () => {
    const subdivision = squareWithHole().toSubdivision();
    const rings = subdivision.multiPolygons.flatMap((multiPolygon) =>
      multiPolygon.polygons.flatMap((polygon) => polygon.rings),
    );

    expect(rings.length).toBe(2);
  });

  test("terminates when an inner edge leads back to its own face.", () => {
    const dcel = squareWithHole();
    const face = dcel.getBoundedFaces().find((d) => d.innerEdges.length > 0);
    expect(face).toBeDefined();

    // Degenerate topology, which simplified real-world input can produce:
    // an inner edge whose face is the face listing it. This used to recurse
    // until the stack overflowed.
    face?.innerEdges.push(face.edge!);

    expect(() => dcel.toSubdivision()).not.toThrow();
  });
});
