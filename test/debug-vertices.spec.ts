import CSchematization from "@/src/c-oriented-schematization/CSchematization";
import CollinearPointProcessor from "@/src/c-oriented-schematization/CollinearPointProcessor";
import FaceFaceBoundaryListGenerator from "@/src/c-oriented-schematization/FaceFaceBoundaryListGenerator";
import ConfigurationGenerator from "@/src/c-oriented-schematization/ConfigurationGenerator";
import EdgeMoveProcessor from "@/src/c-oriented-schematization/EdgeMoveProcessor";
import CRegular from "@/src/c-oriented-schematization/CRegular";
import { ContractionType } from "@/src/c-oriented-schematization/ContractionType";
import Dcel from "@/src/Dcel/Dcel";
import fs from "fs";
import path from "path";
import { describe, test, expect } from "vitest";

describe("Debug vertex removal in smallest-contraction-1a.json", () => {
  test("trace vertices through simplification iterations", () => {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/smallest-contraction-1a.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    console.log("\n=== INITIAL STATE ===");
    console.log("Vertices:", dcel.vertices.size);
    console.log("HalfEdges:", dcel.halfEdges.size);
    console.log(
      "Bounded face edges:",
      dcel.getBoundedFaces()[0]?.getEdges().length ?? "N/A",
    );

    const schematizer = new CSchematization({
      lambda: 1,
      k: 8,
      c: new CRegular(2),
      staircaseEpsilon: 0.1,
    });

    // Simplification phase
    console.log("\n=== BEFORE COLLINEAR REMOVAL ===");
    let state = dcel;
    console.log("Vertices:", state.vertices.size);
    console.log("HalfEdges:", state.halfEdges.size);
    console.log(
      "Face edges:",
      state.getBoundedFaces()[0]?.getEdges().length ?? "N/A",
    );

    state = new CollinearPointProcessor().run(state);
    console.log("\n=== AFTER COLLINEAR REMOVAL ===");
    console.log("Vertices:", state.vertices.size);
    console.log("HalfEdges:", state.halfEdges.size);
    console.log(
      "Face edges:",
      state.getBoundedFaces()[0]?.getEdges().length ?? "N/A",
    );

    // Edge move iterations
    let iterationCount = 0;
    do {
      iterationCount++;
      console.log(`\n=== ITERATION ${iterationCount} ===`);
      const verticesBeforeMove = state.vertices.size;
      const halfEdgesBeforeMove = state.halfEdges.size;
      const faceEdgesBeforeMove =
        state.getBoundedFaces()[0]?.getEdges().length ?? 0;

      const faceFaceBoundaryList = new FaceFaceBoundaryListGenerator().run(
        state,
      );
      const configurations = new ConfigurationGenerator().run(state);

      const pair =
        faceFaceBoundaryList.getMinimalConfigurationPair(configurations);
      console.log("Pair found:", pair ? "yes" : "no");
      if (pair) {
        console.log("  Contraction area:", pair.contraction.area);
        console.log(
          "  Contraction edge:",
          pair.contraction.configuration.innerEdge.coordKey,
        );
        console.log("  Compensation area:", pair.compensation.area);
        console.log(
          "  Compensation edge:",
          pair.compensation.configuration.innerEdge.coordKey,
        );
      }

      const { dcel: newDcel } = new EdgeMoveProcessor(
        faceFaceBoundaryList,
        configurations,
      ).run(state);
      state = newDcel;

      const verticesAfterMove = state.vertices.size;
      const halfEdgesAfterMove = state.halfEdges.size;
      const faceEdgesAfterMove =
        state.getBoundedFaces()[0]?.getEdges().length ?? 0;

      console.log(
        "Before move:  vertices:",
        verticesBeforeMove,
        "halfEdges:",
        halfEdgesBeforeMove,
        "faceEdges:",
        faceEdgesBeforeMove,
      );
      console.log(
        "After move:   vertices:",
        verticesAfterMove,
        "halfEdges:",
        halfEdgesAfterMove,
        "faceEdges:",
        faceEdgesAfterMove,
      );
      console.log(
        "Change:       vertices:",
        verticesAfterMove - verticesBeforeMove,
        "halfEdges:",
        halfEdgesAfterMove - halfEdgesBeforeMove,
        "faceEdges:",
        faceEdgesAfterMove - faceEdgesBeforeMove,
      );

      // Check if degenerate edges exist
      const degenerateEdges = state.getHalfEdges().filter((e) => {
        const head = e.head;
        return head && e.tail === head;
      });
      if (degenerateEdges.length > 0) {
        console.log(
          "WARNING: Found",
          degenerateEdges.length,
          "degenerate edges!",
        );
      }

      const noProgress = state.halfEdges.size === halfEdgesBeforeMove;
      const belowThreshold = state.halfEdges.size < schematizer.style.k;

      console.log(
        "No progress:",
        noProgress,
        "Below threshold:",
        belowThreshold,
      );

      if (noProgress || belowThreshold) {
        console.log(
          "BREAKING:",
          noProgress ? "no progress" : "below threshold",
        );
        break;
      }
    } while (iterationCount < 10); // Safety limit

    console.log(`\n=== FINAL STATE after ${iterationCount} iterations ===`);
    console.log("Vertices:", state.vertices.size);
    console.log("HalfEdges:", state.halfEdges.size);
    console.log(
      "Bounded face edges:",
      state.getBoundedFaces()[0]?.getEdges().length ?? "N/A",
    );

    expect(iterationCount).toBeGreaterThan(0);
  });

  test("test triangle.json simplification with full pipeline - detailed debugging", () => {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/triangle.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);
    console.log(
      "\n\n========== TRIANGLE TEST (FULL PIPELINE - DETAILED) ==========",
    );

    const schematizer = new CSchematization({
      lambda: 1,
      k: 3,
      c: new CRegular(2),
      staircaseEpsilon: 0.1,
    });

    let state = dcel;
    state = schematizer.preProcess(state);
    state = schematizer.constrainAngles(state);
    state = new CollinearPointProcessor().run(state);

    console.log(
      `\nAfter preprocessing: ${state.halfEdges.size} halfEdges, ${state.vertices.size} vertices`,
    );

    let iterationCount = 0;
    do {
      iterationCount++;
      console.log(`\n${"=".repeat(60)}`);
      console.log(`ITERATION ${iterationCount}`);
      console.log(`${"=".repeat(60)}`);

      const halfEdgesBeforeMove = state.halfEdges.size;

      const faceFaceBoundaryList = new FaceFaceBoundaryListGenerator().run(
        state,
      );
      const configurations = new ConfigurationGenerator().run(state);

      console.log(
        `\nConfigurations: ${configurations.size}, FaceFaceBoundaries: ${faceFaceBoundaryList.boundaries.size}`,
      );

      // Analyze ALL contractions - feasible and infeasible
      let totalContractions = 0;
      let feasiblePContractions = 0;
      let feasibleNContractions = 0;
      let blockedContractions = 0;
      const contractionAnalysis: { edge: string; p: string; n: string }[] = [];

      configurations.forEach((config, edgeKey) => {
        const pCon = config[ContractionType.P];
        const nCon = config[ContractionType.N];

        let pStatus = "undefined";
        let nStatus = "undefined";

        if (pCon) {
          totalContractions++;
          if (pCon.isFeasible) {
            feasiblePContractions++;
            pStatus = `✓ area=${pCon.area.toFixed(2)} block=${pCon.blockingNumber}`;
          } else {
            if (pCon.blockingNumber > 0) {
              blockedContractions++;
              pStatus = `✗ blocked(${pCon.blockingNumber}) area=${pCon.area.toFixed(2)}`;
            } else {
              pStatus = `✗ area=${pCon.area.toFixed(2)} (negative)`;
            }
          }
        }

        if (nCon) {
          totalContractions++;
          if (nCon.isFeasible) {
            feasibleNContractions++;
            nStatus = `✓ area=${nCon.area.toFixed(2)} block=${nCon.blockingNumber}`;
          } else {
            if (nCon.blockingNumber > 0) {
              blockedContractions++;
              nStatus = `✗ blocked(${nCon.blockingNumber}) area=${nCon.area.toFixed(2)}`;
            } else {
              nStatus = `✗ area=${nCon.area.toFixed(2)} (negative)`;
            }
          }
        }

        contractionAnalysis.push({ edge: edgeKey, p: pStatus, n: nStatus });
      });

      console.log(`\nContraction Summary:`);
      console.log(
        `  Total: ${totalContractions}, Feasible P: ${feasiblePContractions}, Feasible N: ${feasibleNContractions}`,
      );
      console.log(
        `  Blocked: ${blockedContractions}, Undefined: ${configurations.size * 2 - totalContractions}`,
      );

      // Show details for first few configurations
      console.log(`\nFirst 5 configurations:`);
      contractionAnalysis.slice(0, 5).forEach((a) => {
        console.log(`  ${a.edge}: P[${a.p}] N[${a.n}]`);
      });
      if (contractionAnalysis.length > 5) {
        console.log(`  ... and ${contractionAnalysis.length - 5} more`);
      }

      const pair =
        faceFaceBoundaryList.getMinimalConfigurationPair(configurations);
      console.log(`\nPair found: ${pair ? "YES" : "NO"}`);
      if (pair) {
        const contEdge = pair.contraction.configuration.innerEdge;
        const compEdge = pair.compensation.configuration.innerEdge;
        console.log(
          `  Contraction: ${contEdge.coordKey} (area=${pair.contraction.area.toFixed(2)}, block=${pair.contraction.blockingNumber})`,
        );
        console.log(
          `  Compensation: ${compEdge.coordKey} (area=${pair.compensation.area.toFixed(2)}, block=${pair.compensation.blockingNumber})`,
        );

        // Check if edges still exist in DCEL
        const contractionExists = state.halfEdges.has(contEdge.coordKey ?? "");
        const compensationExists = state.halfEdges.has(compEdge.coordKey ?? "");
        console.log(
          `  Edge existence by ID: contraction=${contractionExists}, compensation=${compensationExists}`,
        );

        // Also check by coordKey lookup
        const contractionByCoordKey = state
          .getHalfEdges()
          .find((e) => e.coordKey === contEdge.coordKey);
        const compensationByCoordKey = state
          .getHalfEdges()
          .find((e) => e.coordKey === compEdge.coordKey);
        console.log(
          `  Edge existence by coordKey: contraction=${!!contractionByCoordKey}, compensation=${!!compensationByCoordKey}`,
        );

        if (contractionByCoordKey) {
          console.log(
            `    Contraction: config-ID=${contEdge.id}, dcel-ID=${contractionByCoordKey.id}, same=${contEdge === contractionByCoordKey}`,
          );
        }
      }

      const { dcel: newDcel } = new EdgeMoveProcessor(
        faceFaceBoundaryList,
        configurations,
      ).run(state);
      state = newDcel;

      const halfEdgesAfterMove = state.halfEdges.size;
      console.log(
        `\nMove result: ${halfEdgesBeforeMove} → ${halfEdgesAfterMove} halfEdges`,
      );

      const noProgress = state.halfEdges.size === halfEdgesBeforeMove;
      const belowThreshold = state.halfEdges.size <= schematizer.style.k * 2;

      if (noProgress || belowThreshold) {
        console.log(
          `STOPPING: ${noProgress ? "no progress" : "below threshold (k=" + schematizer.style.k + ")"}`,
        );
        break;
      }
    } while (iterationCount < 10);

    console.log(`\n${"=".repeat(60)}`);
    console.log(
      `FINAL: ${iterationCount} iterations, ${state.halfEdges.size} halfEdges remaining`,
    );
    console.log(`${"=".repeat(60)}\n`);

    expect(iterationCount).toBeGreaterThan(0);
  });

  test("test diamond.json simplification with full pipeline", () => {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/diamond.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);
    console.log("\n\n========== DIAMOND TEST (FULL PIPELINE) ==========");
    console.log("\n=== INITIAL STATE ===");
    console.log("Vertices:", dcel.vertices.size);
    console.log("HalfEdges:", dcel.halfEdges.size);

    const schematizer = new CSchematization({
      lambda: 1,
      k: 4,
      c: new CRegular(2),
      staircaseEpsilon: 0.1,
    });

    let state = dcel;

    // Run through full schematization pipeline
    state = schematizer.preProcess(state);
    console.log("\n=== AFTER PREPROCESS ===");
    console.log("Vertices:", state.vertices.size);
    console.log("HalfEdges:", state.halfEdges.size);

    state = schematizer.constrainAngles(state);
    console.log("\n=== AFTER ANGLE CONSTRAINING ===");
    console.log("Vertices:", state.vertices.size);
    console.log("HalfEdges:", state.halfEdges.size);

    // Now run simplification iterations
    state = new CollinearPointProcessor().run(state);
    console.log("\n=== AFTER COLLINEAR REMOVAL ===");
    console.log("Vertices:", state.vertices.size);
    console.log("HalfEdges:", state.halfEdges.size);

    let iterationCount = 0;
    do {
      iterationCount++;
      console.log(`\n=== ITERATION ${iterationCount} ===`);
      const halfEdgesBeforeMove = state.halfEdges.size;

      const faceFaceBoundaryList = new FaceFaceBoundaryListGenerator().run(
        state,
      );
      const configurations = new ConfigurationGenerator().run(state);

      console.log("  Configurations found:", configurations.size);

      // Show configuration details
      console.log("\n  === Configuration Details ===");
      let feasiblePCount = 0,
        feasibleNCount = 0;
      configurations.forEach((config, edgeKey) => {
        const pCon = config[ContractionType.P];
        const nCon = config[ContractionType.N];
        if (pCon) {
          const isFeas = pCon.isFeasible;
          console.log(
            `  Edge ${edgeKey}: P-Con feasible=${isFeas} (area=${pCon.area}, blocking=${pCon.blockingNumber})`,
          );
          if (isFeas) feasiblePCount++;
        } else {
          console.log(
            `  Edge ${edgeKey}: P-Con=undefined (getPoint returned no point)`,
          );
        }
        if (nCon) {
          const isFeas = nCon.isFeasible;
          console.log(
            `  Edge ${edgeKey}: N-Con feasible=${isFeas} (area=${nCon.area}, blocking=${nCon.blockingNumber})`,
          );
          if (isFeas) feasibleNCount++;
        } else {
          console.log(
            `  Edge ${edgeKey}: N-Con=undefined (getPoint returned no point)`,
          );
        }
      });
      console.log(`  Feasible: P=${feasiblePCount}, N=${feasibleNCount}`);

      const pair =
        faceFaceBoundaryList.getMinimalConfigurationPair(configurations);
      console.log("  Pair found:", pair ? "yes" : "no");

      const { dcel: newDcel } = new EdgeMoveProcessor(
        faceFaceBoundaryList,
        configurations,
      ).run(state);
      state = newDcel;

      const halfEdgesAfterMove = state.halfEdges.size;
      console.log("  HalfEdges:", halfEdgesBeforeMove, "→", halfEdgesAfterMove);

      const noProgress = state.halfEdges.size === halfEdgesBeforeMove;
      const belowThreshold = state.halfEdges.size <= schematizer.style.k * 2;

      if (noProgress || belowThreshold) {
        console.log(
          "  BREAKING:",
          noProgress ? "no progress" : "below threshold",
        );
        break;
      }
    } while (iterationCount < 10);

    console.log(`\n=== FINAL STATE after ${iterationCount} iterations ===`);
    console.log("HalfEdges:", state.halfEdges.size);

    expect(iterationCount).toBeGreaterThan(0);
  });
});
