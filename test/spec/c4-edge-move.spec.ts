import ConfigurationGenerator from "@/src/c-oriented-schematization/ConfigurationGenerator";
import CRegular from "@/src/c-oriented-schematization/CRegular";
import CSchematization from "@/src/c-oriented-schematization/CSchematization";
import EdgeMoveProcessor from "@/src/c-oriented-schematization/EdgeMoveProcessor";
import FaceFaceBoundaryListGenerator from "@/src/c-oriented-schematization/FaceFaceBoundaryListGenerator";
import { isAlignedToC } from "@/src/c-oriented-schematization/HalfEdgeUtils";
import Dcel from "@/src/Dcel/Dcel";
import Subdivision from "@/src/geometry/Subdivision";
import fs from "fs";
import path from "path";
import { describe, expect, test } from "vitest";

describe("c4-edge-move.subdivision.json - New Direction Debug", function () {
  const json = JSON.parse(
    fs.readFileSync(
      path.resolve("test/data/shapes/c4-edge-move.subdivision.json"),
      "utf8",
    ),
  );

  test("should not introduce new orientations after first edge move", function () {
    const dcel = Dcel.fromSubdivision(Subdivision.fromCoordinates(json));
    const schematization = new CSchematization({
      c: new CRegular(4),
      lambda: 1,
      k: 3,
      staircaseEpsilon: 0.1,
    });

    // No constraint needed, data is already an angle-constrained subdivision.
    // Run one iteration of edge move
    const configurations = new ConfigurationGenerator().run(dcel);
    const ffb = new FaceFaceBoundaryListGenerator().run(dcel);

    const { dcel: dcelAfterMove } = new EdgeMoveProcessor(
      ffb,
      configurations,
    ).run(dcel.clone());

    // Check for unaligned edges after move
    const unalignedAfterMove = dcelAfterMove
      .getHalfEdges()
      .filter((e) => !isAlignedToC(e, schematization.style.c));

    expect(unalignedAfterMove).toHaveLength(0);
  });

  test.fails("should preserve area and edge alignment through full schematization", function () {
    const dcel = Dcel.fromSubdivision(Subdivision.fromCoordinates(json));
    const schematization = new CSchematization({
      lambda: 1,
      k: 8,
      c: new CRegular(4),
      staircaseEpsilon: 0.1,
    });
    const originalArea = dcel.getArea();

    const result = schematization.run(dcel);
    const finalArea = result.getArea();

    // Verify all edges are aligned to C
    const unalignedCount = result.getHalfEdges().reduce((count, edge) => {
      const angle = edge.getAngle();
      if (angle === undefined || !isAlignedToC(edge, schematization.style.c)) {
        return count + 1;
      }
      return count;
    }, 0);

    expect(unalignedCount).toBe(0);
    expect(finalArea).toBeCloseTo(originalArea, 1);
  });
});
