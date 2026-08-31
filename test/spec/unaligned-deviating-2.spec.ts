import CSchematization from "@/src/c-oriented-schematization/CSchematization";
import { isAlignedToC } from "@/src/c-oriented-schematization/HalfEdgeUtils";
import Face from "@/src/Dcel/Face";
import Dcel from "@/src/Dcel/Dcel";
import { DECIMAL_SCALE } from "@/src/geometry/constants";
import fs from "fs";
import path from "path";
import { describe, expect, test } from "vitest";

describe("unaligned-deviating-2.json - Geometry Progression", function () {
  const json = JSON.parse(
    fs.readFileSync(
      path.resolve("test/data/shapes/unaligned-deviating-2.json"),
      "utf8",
    ),
  );

  test("Check geometry after several edge move iterations", function () {
    const initialDcel = Dcel.fromGeoJSON(json);
    const schematization = new CSchematization();

    const initialArea = initialDcel.getArea();

    for (let maxMoves = 1; maxMoves <= 10; maxMoves++) {
      const dcel = Dcel.fromGeoJSON(json);
      const result = schematization.run(dcel, maxMoves);

      const finalArea = result.getArea();

      // Count unaligned edges
      const faces = result.getBoundedFaces();
      let unalignedCount = 0;

      for (const face of faces) {
        const edges = face.getEdges();
        for (const edge of edges) {
          const angle = edge.getAngle();
          if (angle === undefined) {
            unalignedCount++;
          } else {
            const isValid = isAlignedToC(edge, schematization.style.c);
            if (!isValid) {
              unalignedCount++;
            }
          }
        }
      }

      const areaLost = initialArea - finalArea;
      const areaLostPercent =
        initialArea > 0 ? (areaLost / initialArea) * 100 : 0;

      expect(unalignedCount).toBe(0);
      expect(finalArea).toBeCloseTo(8, DECIMAL_SCALE);
      expect(areaLostPercent).toBeLessThan(0.1); // Arbitrary threshold to catch major collapses
    }
  });
});

describe("unaligned-deviating-2.json - Face simplicity", function () {
  const json = JSON.parse(
    fs.readFileSync(
      path.resolve("test/data/shapes/unaligned-deviating-2.json"),
      "utf8",
    ),
  );

  /**
   * Finds a pair of non-adjacent boundary segments of a face that cross or overlap.
   * @param face The {@link Face} to check.
   * @returns A description of the offending pair, or undefined if the face is simple.
   */
  const findSelfIntersection = (face: Face) => {
    const segments = face
      .getEdges()
      .flatMap((edge) => edge.toLineSegment() ?? []);
    return segments.reduce<string | undefined>((found, segment, i) => {
      if (found) return found;
      const conflict = segments.findIndex(
        (other, j) =>
          j > i + 1 &&
          !(i === 0 && j === segments.length - 1) &&
          segment.intersectsLineSegment(other, true),
      );
      return conflict === -1 ? undefined : `segments ${i} and ${conflict}`;
    }, undefined);
  };

  test("Faces stay simple during every edge move", function () {
    const schematization = new CSchematization();

    for (let maxMoves = 1; maxMoves <= 10; maxMoves++) {
      const result = schematization.run(Dcel.fromGeoJSON(json), maxMoves);
      result.getBoundedFaces().forEach((face, i) => {
        expect(
          findSelfIntersection(face),
          `move ${maxMoves}, face ${i}`,
        ).toBeUndefined();
      });
    }
  });
});
