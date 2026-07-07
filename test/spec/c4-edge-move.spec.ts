import ConfigurationGenerator from "@/src/c-oriented-schematization/ConfigurationGenerator";
import CRegular from "@/src/c-oriented-schematization/CRegular";
import CSchematization from "@/src/c-oriented-schematization/CSchematization";
import EdgeMoveProcessor from "@/src/c-oriented-schematization/EdgeMoveProcessor";
import FaceFaceBoundaryListGenerator from "@/src/c-oriented-schematization/FaceFaceBoundaryListGenerator";
import { isAlignedToC } from "@/src/c-oriented-schematization/HalfEdgeUtils";
import Dcel from "@/src/Dcel/Dcel";
import { DECIMAL_SCALE } from "@/src/geometry/constants";
import fs from "fs";
import path from "path";
import { describe, expect, test } from "vitest";

const c4edgemove = JSON.parse(
  fs.readFileSync(
    path.resolve("test/data/shapes/c4-edge-move.subdivision.json"),
    "utf8",
  ),
);

const c4edgemove2 = JSON.parse(
  fs.readFileSync(
    path.resolve("test/data/shapes/c4-edge-move-2.subdivision.json"),
    "utf8",
  ),
);

describe("c4-edge-move.subdivision.json", function () {
  test("should preserve orientations through first edge move", function () {
    const dcel = Dcel.fromCoordinates(c4edgemove);
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

  test.fails("should preserve area and edge alignment through first edge move", function () {
    const dcel = Dcel.fromCoordinates(c4edgemove);
    const originalArea = dcel.getArea();
    // No constraint needed, data is already an angle-constrained subdivision.
    // Run one iteration of edge move
    const configurations = new ConfigurationGenerator().run(dcel);
    const ffb = new FaceFaceBoundaryListGenerator().run(dcel);

    const { dcel: dcelAfterMove } = new EdgeMoveProcessor(
      ffb,
      configurations,
    ).run(dcel.clone());

    expect(dcelAfterMove.getArea()).toBeCloseTo(originalArea, DECIMAL_SCALE);
  });

  //TODO: comment in
  test.fails("should preserve area and edge alignment through full schematization", function () {
    const dcel = Dcel.fromCoordinates(c4edgemove);
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
    expect(finalArea).toBeCloseTo(originalArea, DECIMAL_SCALE);
  });
});

describe("c4-edge-move-2.subdivision.json", function () {
  test("should preserve orientations through first edge move", function () {
    const dcel = Dcel.fromCoordinates(c4edgemove2);

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
});
