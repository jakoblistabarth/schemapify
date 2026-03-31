import CollinearPointProcessor from "@/src/c-oriented-schematization/CollinearPointProcessor";
import ConfigurationGenerator from "@/src/c-oriented-schematization/ConfigurationGenerator";
import { ContractionType } from "@/src/c-oriented-schematization/ContractionType";
import CSchematization from "@/src/c-oriented-schematization/CSchematization";
import FaceFaceBoundaryListGenerator from "@/src/c-oriented-schematization/FaceFaceBoundaryListGenerator";
import Dcel from "@/src/Dcel/Dcel";
import { EPSILON } from "@/src/geometry/contstants";
import Point from "@/src/geometry/Point";
import fs from "fs";
import path from "path";
import { beforeEach, describe, expect, test } from "vitest";
import {
  configurationCases,
  coordKeyOr,
  createConfigurationSetup,
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
    const cA = configurations.get(coordKeyOr(edgeA));

    const edgeB = dcel.findHalfEdge(new Point(4, 1), new Point(4, 3));
    const cB = configurations.get(coordKeyOr(edgeB));

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
    const cA = configurations.get(coordKeyOr(edgeA));

    const edgeB = dcel.findHalfEdge(new Point(2, 0), new Point(2, 1));
    const cB = configurations.get(coordKeyOr(edgeB));

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
    const cA = configurations.get(coordKeyOr(edgeA));

    const edgeB = dcel.findHalfEdge(new Point(2, 1), new Point(1, 1));
    const cB = configurations.get(coordKeyOr(edgeB));

    const edgeC = dcel.findHalfEdge(new Point(1, 2), new Point(0, 3));
    const cC = configurations.get(coordKeyOr(edgeC));

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
    const cA = configurations.get(coordKeyOr(edgeA));

    const edgeB = dcel.findHalfEdge(new Point(10.5, 8), new Point(10, 8));
    const cB = configurations.get(coordKeyOr(edgeB));

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
    const c = configurations.get(coordKeyOr(s.innerEdge));

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
    const c = configurations.get(coordKeyOr(s.innerEdge));

    if (!c || !c[ContractionType.P]) {
      throw new Error("Configuration or contraction undefined.");
    }

    expect(c[ContractionType.P]?.getCompensationHeight(5)).toBe(1);
  });

  test("for an outwards trapezoid compensation area.", function () {
    const s = configurationCases.negConvex;
    const configurations = new ConfigurationGenerator().run(s.dcel);
    const c = configurations.get(coordKeyOr(s.innerEdge));

    if (!c || !c[ContractionType.N]) {
      throw new Error("Configuration or contraction undefined.");
    }

    expect(c[ContractionType.N]?.getCompensationHeight(5)).toBe(1);
    expect(c[ContractionType.N]?.getCompensationHeight(8.25)).toBe(1.5);
  });

  test("for a inwards trapezoid compensation area.", function () {
    const s = configurationCases.posReflex;
    const configurations = new ConfigurationGenerator().run(s.dcel);
    const c = configurations.get(coordKeyOr(s.innerEdge));

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
    const c = configurations.get(coordKeyOr(s.innerEdge));

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
    const c = configurations.get(coordKeyOr(s.innerEdge));

    if (!c || !c[ContractionType.P]) {
      throw new Error("Configuration or contraction undefined.");
    }

    expect(c[ContractionType.P]?.getCompensationHeight(4.5)).toBe(1);
  });
});

describe("First configuration pair in triangle.json after angle constraining", function () {
  test.fails(
    "reveals contraction area height issue and inflection type behavior",
    function () {
      const json = JSON.parse(
        fs.readFileSync(path.resolve("test/data/shapes/triangle.json"), "utf8"),
      );

      let dcel = Dcel.fromGeoJSON(json);
      const schematization = new CSchematization();

      // Preprocess and constrain angles as per pipeline
      dcel = schematization.preProcess(dcel);
      dcel = schematization.constrainAngles(dcel);
      const collinearProcessor = new CollinearPointProcessor();
      dcel = collinearProcessor.run(dcel);

      // Generate configurations and face-face-boundaries
      const configurations = new ConfigurationGenerator().run(dcel);
      const ffbList = new FaceFaceBoundaryListGenerator().run(dcel);

      // Get the minimal configuration pair (the first one to be processed)
      const firstPair = ffbList.getMinimalConfigurationPair(configurations);

      if (!firstPair) {
        throw new Error(
          "No configuration pair found after constraining angles",
        );
      }

      // Log details for debugging
      const areaPoints = firstPair.contraction.areaPoints;
      const area = firstPair.contraction.area;
      const contractionHeight =
        areaPoints.length > 0
          ? Math.max(...areaPoints.map((p) => p.y)) -
            Math.min(...areaPoints.map((p) => p.y))
          : 0;

      // Check for duplicate or collinear areaPoints (which would cause zero area)
      if (areaPoints.length >= 3) {
        const uniquePoints = new Set(areaPoints.map((p) => `${p.x},${p.y}`));
        expect(uniquePoints.size).toBe(areaPoints.length);

        // Verify area points are not all collinear
        const uniquePtsArray = Array.from(uniquePoints).map((str) => {
          const [x, y] = str.split(",").map(Number);
          return { x, y };
        });

        if (uniquePtsArray.length >= 3) {
          const yValues = uniquePtsArray.map((p) => p.y);
          const yRange = Math.max(...yValues) - Math.min(...yValues);

          const xValues = uniquePtsArray.map((p) => p.x);
          const xRange = Math.max(...xValues) - Math.min(...xValues);

          expect(yRange).toBeGreaterThan(1e-10);
          expect(xRange).toBeGreaterThan(1e-10);
        }
      }

      // ASSERTIONS: What we expect vs. what might actually happen
      // 1. Area should be positive and meaningful for a feasible contraction
      // An area below 1e-10 is effectively zero (machine epsilon scale) and indicates precision loss
      const MIN_FEASIBLE_AREA = 1e-10;

      expect(area).toBeGreaterThan(MIN_FEASIBLE_AREA);

      // 2. Contraction height should be nontrivial
      expect(contractionHeight).toBeGreaterThan(0);

      // 3. If this is a shared-edge configuration, verify properties
      const isSharedEdge = firstPair.isSharingEdge?.();
      if (isSharedEdge) {
        const compensationArea = firstPair.compensation.area;

        // In shared edge move, both should have complementary areas
        expect(Math.abs(area - compensationArea)).toBeLessThan(EPSILON);

        // Check the shared outer edge for inflection type
        const outerEdges =
          firstPair.contraction.configuration.getOuterEdges?.();
        if (outerEdges) {
          const compensationOuterEdges =
            firstPair.compensation.configuration.getOuterEdges?.();
          if (compensationOuterEdges) {
            const sharedEdges = outerEdges.filter((e) =>
              compensationOuterEdges.some((ce) => ce.coordKey === e.coordKey),
            );

            expect(sharedEdges.length).toBeGreaterThan(0);
          }
        }
      }
    },
  );
});
