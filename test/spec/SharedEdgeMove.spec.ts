import CollinearPointProcessor from "@/src/c-oriented-schematization/CollinearPointProcessor";
import ConfigurationGenerator from "@/src/c-oriented-schematization/ConfigurationGenerator";
import ConfigurationPair from "@/src/c-oriented-schematization/ConfigurationPair";
import CSchematization from "@/src/c-oriented-schematization/CSchematization";
import EdgeMoveProcessor from "@/src/c-oriented-schematization/EdgeMoveProcessor";
import FaceFaceBoundaryListGenerator from "@/src/c-oriented-schematization/FaceFaceBoundaryListGenerator";
import Dcel from "@/src/Dcel/Dcel";
import { EPSILON } from "@/src/geometry/contstants";
import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, test, vi } from "vitest";

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
  test("should simplify iteratively without introducing new orientations", function () {
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

    const validAngles = schematization.style.c.angles;

    let moveCount = 0;
    let lastUnalignedEdges:
      | ReturnType<typeof Array.prototype.filter>
      | undefined;
    const maxMoves = 20; // Safety limit to prevent infinite loops

    while (moveCount < maxMoves) {
      // Remove collinear vertices before generating configurations
      const collinearProcessor = new CollinearPointProcessor();
      dcel = collinearProcessor.run(dcel);

      // Regenerate configurations and face-face boundaries from scratch
      const configurations = new ConfigurationGenerator().run(dcel);
      const ffbList = new FaceFaceBoundaryListGenerator().run(dcel);

      const pair = ffbList.getMinimalConfigurationPair(configurations);
      if (!pair) {
        // No more valid moves
        break;
      }

      moveCount += 1;
      const processor = new EdgeMoveProcessor(ffbList, configurations);
      const result = processor.run(dcel);
      dcel = result.dcel;

      // After each move, verify that all edges in the face still have valid angles
      const face = dcel.getBoundedFaces()[0];
      const edges = face.getEdges();

      const unalignedEdges = edges.filter((e) => {
        const angle = e.getAngle();
        if (angle === undefined) {
          return true; // Consider undefined angles as unaligned
        }

        const isValid = validAngles.some((v) => Math.abs(v - angle) <= EPSILON);
        return !isValid; // Return true if invalid
      });

      if (unalignedEdges.length > 0) {
        const invalidDetails = unalignedEdges
          .slice(0, 3)
          .map((e, i) => `${i}: ${e.coordKey} angle=${e.getAngle()}`)
          .join("; ");
        throw new Error(
          `Move ${moveCount} introduced invalid angles: ${invalidDetails}`,
        );
      }

      lastUnalignedEdges = unalignedEdges;
    }

    // After all moves, verify that we made progress and no invalid angles exist
    expect(moveCount).toBeGreaterThan(0);
    expect(lastUnalignedEdges).toHaveLength(0); // Final state should have no unaligned edges
  });
});
