import CRegular from "@/src/c-oriented-schematization/CRegular";
import CSchematization from "@/src/c-oriented-schematization/CSchematization";
import { style } from "@/src/c-oriented-schematization/schematization.style";
import Dcel from "@/src/Dcel/Dcel";
import { degreesToRadians } from "@/src/utilities";
import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, test } from "vitest";

/**
 * Schematizes a shape, walking the rings of every step on the way, which is what
 * recording a snapshot does. A face cycle can be sound while a ring is not, so this
 * reaches defects `Face#getEdges` cannot see — a hole whose registered inner edge is
 * no longer part of it, above all.
 * @param shape The name of a shape in `test/data/shapes`.
 * @param orientations The number of orientations of C.
 * @param beta The rotation of C, in degrees.
 */
const schematizeWalkingEveryRing = (
  shape: string,
  orientations: number,
  beta: number,
) => {
  const json = JSON.parse(
    readFileSync(resolve("test/data/shapes", shape), "utf8"),
  );
  const schematization = new CSchematization(
    { ...style, c: new CRegular(orientations, degreesToRadians(beta)) },
    {
      visualize: ({ dcel, forSnapshots }) =>
        forSnapshots && dcel.toSubdivision(),
    },
  );

  schematization.run(Dcel.fromGeoJSON(json));
};

describe("Every step of a schematization can be turned into a subdivision", function () {
  // Merging two vertices can leave an edge running from one to itself, and such an
  // edge was removed from the Dcel while the face enclosing it kept holding it as
  // the start of its hole.
  test.each([
    ["2plgn-islands-hole.json", 2, 1],
    ["2plgn-islands-hole.json", 4, 5],
    ["2plgn-islands-holes.json", 3, 1],
    ["square-hole.json", 3, 5],
    ["2plgn-islands-holes.json", 4, 1],
    ["enclave.json", 4, 1],
  ])(
    "holds for %s under C(%i) shifted by %i degrees",
    function (shape, orientations, beta) {
      expect(() =>
        schematizeWalkingEveryRing(shape, orientations, beta),
      ).not.toThrow();
    },
  );
});

describe("A hole outlives the edge it is reached through", function () {
  /**
   * Counts the rings of every polygon, so a hole going missing shows up.
   * @param dcel The {@link Dcel} to count in.
   * @returns One count per polygon.
   */
  const ringCounts = (dcel: Dcel) =>
    dcel
      .toSubdivision()
      .multiPolygons.flatMap((multiPolygon) =>
        multiPolygon.polygons.map((polygon) => polygon.rings.length),
      );

  test("keeps the lakes of edge-cases under C(4)", function () {
    // Both lakes used to be lost, at the point where the edge each was reached
    // through collapsed onto itself and was removed with the hole still there.
    const json = JSON.parse(
      readFileSync(resolve("test/data/shapes/edge-cases.json"), "utf8"),
    );
    const schematization = new CSchematization({
      ...style,
      c: new CRegular(4),
    });
    const before = ringCounts(Dcel.fromGeoJSON(json));

    const result = schematization.run(Dcel.fromGeoJSON(json));

    expect(before).toContain(3);
    expect(ringCounts(result)).toEqual(before);
  });
});
