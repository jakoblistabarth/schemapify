import Dcel from "@/src/Dcel/Dcel";
import { describe, expect, test } from "vitest";

describe("Walking a ring of a Dcel", () => {
  /** A square, whose single bounded face has a four-edge ring. */
  const square = () =>
    Dcel.fromCoordinates([
      [
        [
          [
            [0, 0],
            [2, 0],
            [2, 2],
            [0, 2],
          ],
        ],
      ],
    ]);

  test("collects one coordinate per edge of an intact ring", () => {
    const ring = square().toSubdivision().multiPolygons[0].polygons[0].rings[0];
    // A Ring repeats its first point to close itself.
    expect(ring.points.length).toBe(5);
  });

  test("reports a ring with a missing next pointer", () => {
    const dcel = square();
    const face = dcel.getBoundedFaces()[0];
    const [, , third] = face.getEdges();
    third.next = undefined;

    expect(() => dcel.toSubdivision()).toThrowError(/no next pointer/);
  });

  test("reports a ring which never returns to its start", () => {
    const dcel = square();
    const face = dcel.getBoundedFaces()[0];
    const [first, second, , fourth] = face.getEdges();
    // Close the ring behind the face's edge, so walking from it runs in a
    // cycle it is not part of.
    fourth.next = second;

    expect(face.edge).toBe(first);
    expect(() => dcel.toSubdivision()).toThrowError(/Ring is broken/);
  });
});
