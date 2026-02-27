import ConfigurationGenerator from "@/src/c-oriented-schematization/ConfigurationGenerator";
import { ContractionType } from "@/src/c-oriented-schematization/ContractionType";
import Dcel from "@/src/Dcel/Dcel";
import Point from "@/src/geometry/Point";
import fs from "fs";
import path from "path";
import { beforeEach, describe, expect, test } from "vitest";
import {
  configurationCases,
  createConfigurationSetup,
  idOr,
} from "./test-setup";

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

  test("false for 2 non-conflicting contractions. (1.1)", function () {
    const configurations = new ConfigurationGenerator().run(dcel);

    const edgeA = dcel.findHalfEdge(new Point(5, 0), new Point(5, 1));
    const cA = configurations.get(idOr(edgeA));

    const edgeB = dcel.findHalfEdge(new Point(4, 1), new Point(4, 3));
    const cB = configurations.get(idOr(edgeB));

    if (!cA || !cB || !cB[ContractionType.N]) {
      throw new Error("Configurations or contractions undefined.");
    }

    expect(cA[ContractionType.N]?.isConflicting(cB[ContractionType.N])).toBe(
      false,
    );
  });

  test("true for 2 conflicting contractions, due to 2 overlapping Edges. (1.2)", function () {
    const configurations = new ConfigurationGenerator().run(dcel);

    const edgeA = dcel.findHalfEdge(new Point(0, 0), new Point(2, 0));
    const cA = configurations.get(idOr(edgeA));

    const edgeB = dcel.findHalfEdge(new Point(2, 0), new Point(2, 1));
    const cB = configurations.get(idOr(edgeB));

    if (!cA || !cB || !cB[ContractionType.N]) {
      throw new Error("Configurations or contractions undefined.");
    }

    expect(cA[ContractionType.N]?.isConflicting(cB[ContractionType.N])).toBe(
      true,
    );
  });

  test("true for 2 conflicting contractions, due to wrong inflectionType of the overlapping Edge. (1.3)", function () {
    const configurations = new ConfigurationGenerator().run(dcel);

    const edgeA = dcel.findHalfEdge(new Point(0, 0), new Point(2, 0));
    const cA = configurations.get(idOr(edgeA));

    const edgeB = dcel.findHalfEdge(new Point(2, 1), new Point(1, 1));
    const cB = configurations.get(idOr(edgeB));

    const edgeC = dcel.findHalfEdge(new Point(1, 2), new Point(0, 3));
    const cC = configurations.get(idOr(edgeC));

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

  test("true for 2 conflicting contractions, due to too many overlapping Edges. (1.4)", function () {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/smallest-contraction-2.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    const configurations = new ConfigurationGenerator().run(dcel);
    const edgeA = dcel.findHalfEdge(new Point(10.5, 7), new Point(10.5, 8));
    const cA = configurations.get(idOr(edgeA));

    const edgeB = dcel.findHalfEdge(new Point(10.5, 8), new Point(10, 8));
    const cB = configurations.get(idOr(edgeB));

    if (!cA || !cB || !cB[ContractionType.N] || !cB[ContractionType.N]) {
      throw new Error("Configurations or contractions undefined.");
    }

    expect(cA[ContractionType.N]?.isConflicting(cB[ContractionType.N])).toBe(
      true,
    );
  });
});

describe("getCompensationShift() returns", function () {
  test("for a rectangular compensation area.", function () {
    const s = configurationCases.negConvexParallelTracks;
    const configurations = new ConfigurationGenerator().run(s.dcel);
    const c = configurations.get(idOr(s.innerEdge));

    if (!c || !c[ContractionType.N]) {
      throw new Error("Configuration or contraction undefined.");
    }

    expect(c[ContractionType.N]?.getCompensationHeight(2)).toBe(0.5);
    expect(c[ContractionType.N]?.getCompensationHeight(4)).toBe(1);
    expect(c[ContractionType.N]?.getCompensationHeight(6)).toBe(1.5);
  });

  test("for an inwards trapezoid compensation area.", function () {
    const s = configurationCases.posReflex;
    const configurations = new ConfigurationGenerator().run(s.dcel);
    const c = configurations.get(idOr(s.innerEdge));

    if (!c || !c[ContractionType.P]) {
      throw new Error("Configuration or contraction undefined.");
    }

    expect(c[ContractionType.P]?.getCompensationHeight(5)).toBe(1);
  });

  test("for an outwards trapezoid compensation area.", function () {
    const s = configurationCases.negConvex;
    const configurations = new ConfigurationGenerator().run(s.dcel);
    const c = configurations.get(idOr(s.innerEdge));

    if (!c || !c[ContractionType.N]) {
      throw new Error("Configuration or contraction undefined.");
    }

    expect(c[ContractionType.N]?.getCompensationHeight(5)).toBe(1);
    expect(c[ContractionType.N]?.getCompensationHeight(8.25)).toBe(1.5);
  });

  test("for a inwards trapezoid compensation area.", function () {
    const s = configurationCases.posReflex;
    const configurations = new ConfigurationGenerator().run(s.dcel);
    const c = configurations.get(idOr(s.innerEdge));

    if (!c || !c[ContractionType.P]) {
      throw new Error("Configuration or contraction undefined.");
    }

    expect(c[ContractionType.P]?.getCompensationHeight(5)).toBe(1);
  });

  test("for a trapezoid compensation area with 2 90deg angles.", function () {
    const s = createConfigurationSetup(
      new Point(-2, 0),
      new Point(-2, 2),
      new Point(2, 2),
      new Point(4, 0),
      [new Point(4, 6), new Point(-4, 6)],
    );
    const configurations = new ConfigurationGenerator().run(s.dcel);
    const c = configurations.get(idOr(s.innerEdge));

    if (!c || !c[ContractionType.P]) {
      throw new Error("Configuration or contraction undefined.");
    }

    expect(c[ContractionType.P]?.getCompensationHeight(4.5)).toBe(1);
  });

  test("for a trapezoid compensation area with 2 90deg angles.", function () {
    const s = createConfigurationSetup(
      new Point(-4, 0),
      new Point(-2, 2),
      new Point(2, 2),
      new Point(2, 0),
      [new Point(4, 6), new Point(-4, 4)],
    );
    const configurations = new ConfigurationGenerator().run(s.dcel);
    const c = configurations.get(idOr(s.innerEdge));

    if (!c || !c[ContractionType.P]) {
      throw new Error("Configuration or contraction undefined.");
    }

    expect(c[ContractionType.P]?.getCompensationHeight(4.5)).toBe(1);
  });
});
