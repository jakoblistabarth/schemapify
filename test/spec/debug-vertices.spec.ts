import CollinearPointProcessor from "@/src/c-oriented-schematization/CollinearPointProcessor";
import ConfigurationGenerator from "@/src/c-oriented-schematization/ConfigurationGenerator";
import CRegular from "@/src/c-oriented-schematization/CRegular";
import CSchematization from "@/src/c-oriented-schematization/CSchematization";
import EdgeMoveProcessor from "@/src/c-oriented-schematization/EdgeMoveProcessor";
import FaceFaceBoundaryListGenerator from "@/src/c-oriented-schematization/FaceFaceBoundaryListGenerator";
import Dcel from "@/src/Dcel/Dcel";
import fs from "fs";
import path from "path";
import { describe, expect, test } from "vitest";

describe("Debug vertex removal in smallest-contraction-1a.json", () => {
  test("trace vertices through simplification iterations", () => {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/smallest-contraction-1a.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);

    const schematizer = new CSchematization({
      lambda: 1,
      k: 8,
      c: new CRegular(2),
      staircaseEpsilon: 0.1,
    });

    // Simplification phase
    let state = dcel;
    state = new CollinearPointProcessor().run(state);

    // Edge move iterations
    let iterationCount = 0;
    do {
      iterationCount++;
      const halfEdgesBeforeMove = state.halfEdges.size;

      const faceFaceBoundaryList = new FaceFaceBoundaryListGenerator().run(
        state,
      );
      const configurations = new ConfigurationGenerator().run(state);

      const { dcel: newDcel } = new EdgeMoveProcessor(
        faceFaceBoundaryList,
        configurations,
      ).run(state);
      state = newDcel;

      const noProgress = state.halfEdges.size === halfEdgesBeforeMove;
      const belowThreshold = state.halfEdges.size < schematizer.style.k;

      if (noProgress || belowThreshold) {
        break;
      }
    } while (iterationCount < 10); // Safety limit

    expect(iterationCount).toBeGreaterThan(0);
  });

  test("test triangle.json simplification with full pipeline - detailed debugging", () => {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/triangle.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);

    const schematizer = new CSchematization({
      lambda: 1,
      k: 3,
      c: new CRegular(2),
      staircaseEpsilon: 0.1,
    });

    let state = dcel;
    state = schematizer.run(state, 0); // Run up to angle constraining, skip simplification

    let iterationCount = 0;
    do {
      iterationCount++;
      const halfEdgesBeforeMove = state.halfEdges.size;
      const faceFaceBoundaryList = new FaceFaceBoundaryListGenerator().run(
        state,
      );
      const configurations = new ConfigurationGenerator().run(state);

      const { dcel: newDcel } = new EdgeMoveProcessor(
        faceFaceBoundaryList,
        configurations,
      ).run(state);
      state = newDcel;

      const noProgress = state.halfEdges.size === halfEdgesBeforeMove;
      const belowThreshold = state.halfEdges.size <= schematizer.style.k * 2;

      if (noProgress || belowThreshold) {
        break;
      }
    } while (iterationCount < 10);

    expect(iterationCount).toBeGreaterThan(0);
  });

  test("test diamond.json simplification with full pipeline", () => {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/diamond.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);

    const schematizer = new CSchematization({
      lambda: 1,
      k: 4,
      c: new CRegular(2),
      staircaseEpsilon: 0.1,
    });

    let state = dcel;

    // Run through full schematization pipeline
    state = schematizer.preProcess(state);
    state = schematizer.constrainAngles(state);
    // Now run simplification iterations
    state = new CollinearPointProcessor().run(state);

    let iterationCount = 0;
    do {
      iterationCount++;
      const halfEdgesBeforeMove = state.halfEdges.size;

      const faceFaceBoundaryList = new FaceFaceBoundaryListGenerator().run(
        state,
      );
      const configurations = new ConfigurationGenerator().run(state);

      faceFaceBoundaryList.getMinimalConfigurationPair(configurations);

      const { dcel: newDcel } = new EdgeMoveProcessor(
        faceFaceBoundaryList,
        configurations,
      ).run(state);
      state = newDcel;

      const noProgress = state.halfEdges.size === halfEdgesBeforeMove;
      const belowThreshold = state.halfEdges.size <= schematizer.style.k * 2;

      if (noProgress || belowThreshold) {
        break;
      }
    } while (iterationCount < 10);

    expect(iterationCount).toBeGreaterThan(0);
  });
});
