import Dcel from "@/src/Dcel/Dcel";
import { describe, expect, test } from "vitest";

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
