import CRegular from "@/src/c-oriented-schematization/CRegular";
import CSchematization from "@/src/c-oriented-schematization/CSchematization";
import { style as defaultStyle } from "@/src/c-oriented-schematization/schematization.style";
import Dcel from "@/src/Dcel/Dcel";
import fs from "fs";
import path from "path";
import { describe, expect, test } from "vitest";

const json = JSON.parse(
  fs.readFileSync(
    path.resolve("test/data/shapes/staircase-shared-vertex.json"),
    "utf8",
  ),
);

/**
 * Finds vertices with two incident edges of the same direction, which means the two
 * edges overlap. The rotation of such a vertex is ambiguous, so the next and prev
 * pointers cannot be derived from it.
 * @param dcel The {@link Dcel} to check.
 * @returns A description of every offending vertex.
 */
const findOverlappingEdges = (dcel: Dcel) =>
  dcel.getVertices().flatMap((vertex) => {
    const angles = vertex.edges.map((edge) => edge.getAngle());
    const hasDuplicate = angles.some(
      (angle, index) =>
        angle !== undefined &&
        angles.findIndex(
          (other) => other !== undefined && Math.abs(other - angle) < 1e-9,
        ) !== index,
    );
    return hasDuplicate ? [`(${vertex.x}, ${vertex.y})`] : [];
  });

/**
 * The wedge's two edges enclose an angle of 43.6 degrees, which is narrower than the
 * 45 degrees between two directions of C(4). Only if the shared vertex counts as
 * significant do both edges get a direction of their own, rather than the single
 * direction their two sectors have in common.
 */
describe("Two staircases meeting in one vertex", function () {
  test.each([2, 4])(
    "keep the wedge between them open for C(%i)",
    function (orientations) {
      const schematization = new CSchematization({
        ...defaultStyle,
        c: new CRegular(orientations),
      });
      const input = Dcel.fromGeoJSON(json);

      const constrained = schematization.constrainAngles(
        schematization.preProcess(input),
      );

      expect(findOverlappingEdges(constrained)).toEqual([]);
      expect(constrained.getBoundedFaces().length).toBe(3);
      expect(constrained.getArea()).toBeCloseTo(input.getArea(), 6);
    },
  );

  test.each([2, 4])(
    "survive a round trip through a subdivision for C(%i)",
    function (orientations) {
      const schematization = new CSchematization({
        ...defaultStyle,
        c: new CRegular(orientations),
      });
      const input = Dcel.fromGeoJSON(json);
      const constrained = schematization.constrainAngles(
        schematization.preProcess(input),
      );

      // Overlapping edges leave the rotation ambiguous, which makes the clone
      // merge the faces the ambiguous vertex separates.
      const clone = constrained.clone();

      expect(clone.getBoundedFaces().length).toBe(
        constrained.getBoundedFaces().length,
      );
      expect(clone.getArea()).toBeCloseTo(constrained.getArea(), 6);
    },
  );
});
