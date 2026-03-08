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

    // Apply schematization preprocessing
    dcel = new CollinearPointProcessor().run(dcel);

    // Get initial configuration pair
    let configurations = new ConfigurationGenerator().run(dcel);
    let ffbList = new FaceFaceBoundaryListGenerator().run(dcel);

    let pair = ffbList.getMinimalConfigurationPair(configurations);

    if (!pair) return;

    const processor1 = new EdgeMoveProcessor(ffbList, configurations);
    const result1 = processor1.run(dcel);
    dcel = result1.dcel;
    configurations = result1.configurations;
    ffbList = result1.faceFaceBoundaryList;

    const edgesAfterMove1 = Array.from(dcel.getHalfEdges());

    pair = ffbList.getMinimalConfigurationPair(configurations);
    if (!pair) return;

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

    expect(
      orientationChanges.length,
      "Edge moves should not introduce new orientations",
    ).toBe(0);
  });
});
