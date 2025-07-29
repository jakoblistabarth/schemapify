import fs from "fs";
import path from "path";
import Point from "@/src/geometry/Point";
import Dcel from "@/src/Dcel/Dcel";
import { configurationCases, createConfigurationSetup } from "./test-setup";
import { ContractionType } from "@/src/c-oriented-schematization/ContractionType";
import ConfigurationGenerator from "@/src/c-oriented-schematization/ConfigurationGenerator";

describe("isConflicting() returns", function () {
  let dcel: Dcel;
  beforeEach(function () {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/edge-move-test.json"),
        "utf8",
      ),
    );
    dcel = Dcel.fromGeoJSON(json);
  });

  it("false for 2 non-conflicting contractions. (1.1)", function () {
    const configurations = new ConfigurationGenerator().run(dcel);

    const edgeA = dcel.halfEdges.get("5|0->5|1");
    const cA = configurations.get(edgeA?.uuid ?? "");

    const edgeB = dcel.halfEdges.get("4|1->4|3");
    const cB = configurations.get(edgeB?.uuid ?? "");

    if (!cA || !cB || !cB[ContractionType.N]) {
      throw new Error("Configurations or contractions undefined.");
    }

    expect(cA[ContractionType.N]?.isConflicting(cB[ContractionType.N])).toBe(
      false,
    );
  });

  it("true for 2 conflicting contractions, due to 2 overlapping Edges. (1.2)", function () {
    const configurations = new ConfigurationGenerator().run(dcel);

    const edgeA = dcel.halfEdges.get("0|0->2|0");
    const cA = configurations.get(edgeA?.uuid ?? "");

    const edgeB = dcel.halfEdges.get("2|0->2|1");
    const cB = configurations.get(edgeB?.uuid ?? "");

    if (!cA || !cB || !cB[ContractionType.N]) {
      throw new Error("Configurations or contractions undefined.");
    }

    expect(cA[ContractionType.N]?.isConflicting(cB[ContractionType.N])).toBe(
      true,
    );
  });

  it("true for 2 conflicting contractions, due to wrong inflectionType of the overlapping Edge. (1.3)", function () {
    const configurations = new ConfigurationGenerator().run(dcel);

    const edgeA = dcel.halfEdges.get("0|0->2|0");
    const cA = configurations.get(edgeA?.uuid ?? "");

    const edgeB = dcel.halfEdges.get("2|1->1|1");
    const cB = configurations.get(edgeB?.uuid ?? "");

    const edgeC = dcel.halfEdges.get("1|2->0|3");
    const cC = configurations.get(edgeC?.uuid ?? "");

    if (
      !cA ||
      !cB ||
      !cC ||
      !cB[ContractionType.N] ||
      !cB[ContractionType.P] ||
      !cC[ContractionType.N]
    ) {
      throw new Error("Configurations or contractions undefined.");
    }

    expect(cA[ContractionType.N]?.isConflicting(cB[ContractionType.N])).toBe(
      true,
    );
    expect(cA[ContractionType.N]?.isConflicting(cB[ContractionType.P])).toBe(
      true,
    );
    expect(cA[ContractionType.N]?.isConflicting(cC[ContractionType.N])).toBe(
      true,
    );
  });

  it("true for 2 conflicting contractions, due to too many overlapping Edges. (1.4)", function () {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/smallest-contraction-2.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    const configurations = new ConfigurationGenerator().run(dcel);
    const edgeA = dcel.halfEdges.get("10.5|7->10.5|8");
    const cA = configurations.get(edgeA?.uuid ?? "");

    const edgeB = dcel.halfEdges.get("10.5|8->10|8");
    const cB = configurations.get(edgeB?.uuid ?? "");

    if (!cA || !cB || !cB[ContractionType.N] || !cB[ContractionType.N]) {
      throw new Error("Configurations or contractions undefined.");
    }

    expect(cA[ContractionType.N]?.isConflicting(cB[ContractionType.N])).toBe(
      true,
    );
  });
});

describe("getCompensationShift() returns", function () {
  it("for a rectangular compensation area.", function () {
    const s = configurationCases.negConvexParallelTracks;
    const configurations = new ConfigurationGenerator().run(s.dcel);
    const c = configurations.get(s.innerEdge.uuid);

    if (!c || !c[ContractionType.N]) {
      throw new Error("Configuration or contraction undefined.");
    }

    expect(c[ContractionType.N]?.getCompensationHeight(2)).toBe(0.5);
    expect(c[ContractionType.N]?.getCompensationHeight(4)).toBe(1);
    expect(c[ContractionType.N]?.getCompensationHeight(6)).toBe(1.5);
  });

  it("for an inwards trapezoid compensation area.", function () {
    const s = configurationCases.posReflex;
    const configurations = new ConfigurationGenerator().run(s.dcel);
    const c = configurations.get(s.innerEdge.uuid);

    if (!c || !c[ContractionType.P]) {
      throw new Error("Configuration or contraction undefined.");
    }

    expect(c[ContractionType.P]?.getCompensationHeight(5)).toBe(1);
  });

  it("for an outwards trapezoid compensation area.", function () {
    const s = configurationCases.negConvex;
    const configurations = new ConfigurationGenerator().run(s.dcel);
    const c = configurations.get(s.innerEdge.uuid);

    if (!c || !c[ContractionType.N]) {
      throw new Error("Configuration or contraction undefined.");
    }

    expect(c[ContractionType.N]?.getCompensationHeight(5)).toBe(1);
    expect(c[ContractionType.N]?.getCompensationHeight(8.25)).toBe(1.5);
  });

  it("for a inwards trapezoid compensation area.", function () {
    const s = configurationCases.posReflex;
    const configurations = new ConfigurationGenerator().run(s.dcel);
    const c = configurations.get(s.innerEdge.uuid);

    if (!c || !c[ContractionType.P]) {
      throw new Error("Configuration or contraction undefined.");
    }

    expect(c[ContractionType.P]?.getCompensationHeight(5)).toBe(1);
  });

  it("for a trapezoid compensation area with 2 90deg angles.", function () {
    const s = createConfigurationSetup(
      new Point(-2, 0),
      new Point(-2, 2),
      new Point(2, 2),
      new Point(4, 0),
      [new Point(4, 6), new Point(-4, 6)],
    );
    const configurations = new ConfigurationGenerator().run(s.dcel);
    const c = configurations.get(s.innerEdge.uuid);

    if (!c || !c[ContractionType.P]) {
      throw new Error("Configuration or contraction undefined.");
    }

    expect(c[ContractionType.P]?.getCompensationHeight(4.5)).toBe(1);
  });

  it("for a trapezoid compensation area with 2 90deg angles.", function () {
    const s = createConfigurationSetup(
      new Point(-4, 0),
      new Point(-2, 2),
      new Point(2, 2),
      new Point(2, 0),
      [new Point(4, 6), new Point(-4, 4)],
    );
    const configurations = new ConfigurationGenerator().run(s.dcel);
    const c = configurations.get(s.innerEdge.uuid);

    if (!c || !c[ContractionType.P]) {
      throw new Error("Configuration or contraction undefined.");
    }

    expect(c[ContractionType.P]?.getCompensationHeight(4.5)).toBe(1);
  });
});
