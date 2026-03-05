import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import Dcel from "@/src/Dcel/Dcel";
import ConfigurationGenerator from "@/src/c-oriented-schematization/ConfigurationGenerator";
import FaceFaceBoundaryListGenerator from "@/src/c-oriented-schematization/FaceFaceBoundaryListGenerator";
import EdgeMoveProcessor from "@/src/c-oriented-schematization/EdgeMoveProcessor";
import CollinearPointProcessor from "@/src/c-oriented-schematization/CollinearPointProcessor";

describe("Overlapping configurations", function () {
  it("should not introduce new orientations during second edge move", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/triangle.json"), "utf8"),
    );
    let dcel = Dcel.fromGeoJSON(json);

    const initialEdges = Array.from(dcel.getHalfEdges());
    console.log("\n=== INITIAL STATE ===");
    console.log(`Edges: ${initialEdges.length}`);
    initialEdges.forEach((e) => {
      const angleType = e.getInflectionType();
      console.log(`  ${e.coordKey}: ${angleType}`);
    });

    // Use full schematization pipeline which applies preprocessor and configuration generation
    // const schematizer = new CSchematization({
    //   lambda: 1,
    //   k: 8,
    //   c: new CRegular(2),
    //   staircaseEpsilon: 0.1,
    // });

    // Apply schematization preprocessing
    dcel = new CollinearPointProcessor().run(dcel);

    const edgesAfterPreprocess = Array.from(dcel.getHalfEdges());
    console.log("\n=== AFTER COLLINEAR REMOVAL ===");
    console.log(`Edges: ${edgesAfterPreprocess.length}`);
    edgesAfterPreprocess.forEach((e) => {
      const angleType = e.getInflectionType();
      console.log(`  ${e.coordKey}: ${angleType}`);
    });

    // Get initial configuration pair
    let configurations = new ConfigurationGenerator().run(dcel);
    let ffbList = new FaceFaceBoundaryListGenerator().run(dcel);

    // === FIRST EDGE MOVE ===
    console.log("\n=== FIRST EDGE MOVE ===");
    let pair = ffbList.getMinimalConfigurationPair(configurations);

    if (!pair) {
      console.log("No configuration pair found for first move");
      return;
    }

    console.log(`Pair found:`);
    console.log(
      `  Contraction: ${pair.contraction.configuration.innerEdge.coordKey} (area=${pair.contraction.area.toFixed(2)})`,
    );
    console.log(
      `  Compensation: ${pair.compensation.configuration.innerEdge.coordKey} (area=${pair.compensation.area.toFixed(2)})`,
    );

    // Check for shared outer edges (overlapping configurations)
    const overlapEdges = pair.contraction.getOverlappingEdges(
      pair.compensation,
    );
    console.log(`  Overlapping edges: ${overlapEdges.length}`);
    overlapEdges.forEach((e) => {
      console.log(`    - ${e.coordKey}`);
    });

    const processor1 = new EdgeMoveProcessor(ffbList, configurations);
    const result1 = processor1.run(dcel);
    dcel = result1.dcel;
    configurations = result1.configurations;
    ffbList = result1.faceFaceBoundaryList;

    const edgesAfterMove1 = Array.from(dcel.getHalfEdges());
    console.log(`\nAfter first move: ${edgesAfterMove1.length} edges`);
    edgesAfterMove1.forEach((e) => {
      const angleType = e.getInflectionType();
      console.log(`  ${e.coordKey}: ${angleType}`);
    });

    // === SECOND EDGE MOVE ===
    console.log("\n=== SECOND EDGE MOVE ===");

    pair = ffbList.getMinimalConfigurationPair(configurations);
    if (!pair) {
      console.log("No configuration pair found for second move");
      return;
    }

    console.log(`Pair found:`);
    console.log(
      `  Contraction: ${pair.contraction.configuration.innerEdge.coordKey} (area=${pair.contraction.area.toFixed(2)})`,
    );
    console.log(
      `  Compensation: ${pair.compensation.configuration.innerEdge.coordKey} (area=${pair.compensation.area.toFixed(2)})`,
    );

    const overlapEdges2 = pair.contraction.getOverlappingEdges(
      pair.compensation,
    );
    console.log(`  Overlapping edges: ${overlapEdges2.length}`);
    overlapEdges2.forEach((e) => {
      console.log(`    - ${e.coordKey}: ${e.getInflectionType()}`);
    });

    // Track edge changes during second move
    const edgesBeforeMove2 = new Map(
      edgesAfterMove1.map((e) => [
        e.coordKey,
        { coordKey: e.coordKey, type: e.getInflectionType() },
      ]),
    );

    const processor2 = new EdgeMoveProcessor(ffbList, configurations);
    const result2 = processor2.run(dcel);
    dcel = result2.dcel;

    const edgesAfterMove2 = Array.from(dcel.getHalfEdges());
    console.log(`\nAfter second move: ${edgesAfterMove2.length} edges`);

    // Find edges that changed inflection type
    const orientationChanges: Array<{
      key?: string;
      before?: string;
      after?: string;
    }> = [];
    edgesAfterMove2.forEach((e) => {
      const before = edgesBeforeMove2.get(e.coordKey);
      const after = e.getInflectionType();
      if (before && before.type !== after) {
        orientationChanges.push({
          key: e.coordKey,
          before: before.type,
          after,
        });
      }
    });

    edgesAfterMove2.forEach((e) => {
      const before = edgesBeforeMove2.get(e.coordKey);
      const angleType = e.getInflectionType();
      const changed = before && before.type !== angleType;
      console.log(
        `  ${e.coordKey}: ${angleType}${changed ? ` [CHANGED from ${before.type}]` : ""}`,
      );
    });

    // Report orientation changes
    if (orientationChanges.length > 0) {
      console.log(
        `\n⚠️  Found ${orientationChanges.length} orientation changes:`,
      );
      orientationChanges.forEach(({ key, before, after }) => {
        console.log(`  ${key}: ${before} → ${after}`);
      });
    }

    expect(
      orientationChanges.length,
      "Edge moves should not introduce new orientations",
    ).toBe(0);
  });
});
