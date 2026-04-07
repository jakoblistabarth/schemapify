import CSchematization from "@/src/c-oriented-schematization/CSchematization";
import Dcel from "@/src/Dcel/Dcel";
import { EPSILON } from "@/src/geometry/contstants";
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
    const validAngles = schematization.style.c.angles;

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
            const isValid = validAngles.some(
              (v) => Math.abs(v - angle) <= EPSILON,
            );
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
      expect(finalArea).toBeCloseTo(8);
      expect(areaLostPercent).toBeLessThan(0.1); // Arbitrary threshold to catch major collapses
    }
  });
});
