import CSchematization from "@/src/c-oriented-schematization/CSchematization";
import { describe, expect, test, vi } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import Dcel from "@/src/Dcel/Dcel";
import ConfigurationPair from "@/src/c-oriented-schematization/ConfigurationPair";
import EdgeMoveProcessor from "@/src/c-oriented-schematization/EdgeMoveProcessor";
import FaceFaceBoundaryListGenerator from "@/src/c-oriented-schematization/FaceFaceBoundaryListGenerator";
import ConfigurationGenerator from "@/src/c-oriented-schematization/ConfigurationGenerator";

describe("SharedEdgeMove with diamond.json", function () {
  test("Full pipeline: diamond shape should trigger shared edge move coordination", function () {
    const inputJson = JSON.parse(
      readFileSync(resolve("test/data/shapes/diamond.json"), "utf8"),
    );

    const dcel = Dcel.fromGeoJSON(inputJson);
    const schematization = new CSchematization();

    const doSharedEdgeMoveSpy = vi.spyOn(
      ConfigurationPair.prototype,
      "doSharedEdgeMove",
    );
    schematization.run(dcel);

    expect(doSharedEdgeMoveSpy).toHaveBeenCalled();
  });
});

describe("SharedEdgeMove with smallest-contraction.json", function () {
  test("Should trigger shared edge move coordination", function () {
    const inputJson = JSON.parse(
      readFileSync(
        resolve("test/data/shapes/smallest-contraction.json"),
        "utf8",
      ),
    );

    const dcel = Dcel.fromGeoJSON(inputJson);
    const schematization = new CSchematization();

    const doSharedEdgeMoveSpy = vi.spyOn(
      ConfigurationPair.prototype,
      "doSharedEdgeMove",
    );

    schematization.run(dcel);
    expect(doSharedEdgeMoveSpy).toHaveBeenCalled();
  });
});

describe("SharedEdgeMove on smallest-contraction-1a.json", function () {
  test.fails(
    "should simplify iteratively without introducing new orientations",
    function () {
      const inputJson = JSON.parse(
        readFileSync(
          resolve("test/data/shapes/smallest-contraction-1a.json"),
          "utf8",
        ),
      );
      let dcel = Dcel.fromGeoJSON(inputJson);
      const schematization = new CSchematization();

      dcel = schematization.preProcess(dcel);
      dcel = schematization.constrainAngles(dcel);

      // Get valid angles from schematization style
      const validAngles = schematization.style.c.angles;

      let configurations = new ConfigurationGenerator().run(dcel);
      let ffbList = new FaceFaceBoundaryListGenerator().run(dcel);

      let moveCount = 0;
      const maxMoves = 20; // Safety limit to prevent infinite loops

      while (moveCount < maxMoves) {
        const pair = ffbList.getMinimalConfigurationPair(configurations);
        if (!pair) {
          // No more valid moves
          break;
        }

        moveCount += 1;

        const processor = new EdgeMoveProcessor(ffbList, configurations);
        const result = processor.run(dcel);
        dcel = result.dcel;
        configurations = result.configurations;
        ffbList = result.faceFaceBoundaryList;

        // After each move, verify that all vertices in the face still have valid angles
        const invalidAngles: string[] = [];
        const face = dcel.getBoundedFaces()[0];
        const edges = face.getEdges();
        const vertices = [...new Set(edges.map((edge) => edge.tail))];
        vertices.forEach((vertex) => {
          let angle = vertex.getExteriorAngle(face);
          if (!angle && angle !== 0) return;
          // Normalize negative angles to [0, 2π)
          if (angle < 0) {
            angle += 2 * Math.PI;
          }
          // Check if angle is approximately one of the valid angles (with tolerance for floating point)
          const isValid = validAngles.some(
            (valid) => Math.abs(angle - valid) < 0.001,
          );
          if (!isValid) {
            invalidAngles.push(
              `${vertex.xy}: angle=${angle.toFixed(4)} (not in ${validAngles.map((a) => a.toFixed(4)).join(", ")})`,
            );
          }
        });

        if (invalidAngles.length > 0) {
          throw new Error(
            `Move ${moveCount} introduced invalid angles: ${invalidAngles.slice(0, 3).join("; ")}`,
          );
        }
      }

      expect(moveCount).toBeGreaterThan(0);
    },
  );
});
