import Dcel from "@/src/Dcel/Dcel";
import CSchematization from "@/src/c-oriented-schematization/CSchematization";
import ConfigurationGenerator from "@/src/c-oriented-schematization/ConfigurationGenerator";
import FaceFaceBoundaryList from "@/src/c-oriented-schematization/FaceFaceBoundaryList";
import FaceFaceBoundaryListGenerator from "@/src/c-oriented-schematization/FaceFaceBoundaryListGenerator";
import Subdivision from "@/src/geometry/Subdivision";
import { readFileSync } from "fs";
import path from "path";
import { describe, expect, test } from "vitest";

describe("create()", function () {
  test("on a dcel of 2 adjacent squares returns FaceFaceBoundaryList with 3 entries and the correct number of Edges", function () {
    const json = JSON.parse(
      readFileSync(
        path.resolve("test/data/shapes/2plgn-adjacent.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    const ffb = new FaceFaceBoundaryList(dcel);
    const lengths = Array.from(ffb.boundaries.values())
      .map((b) => b.edges.length)
      .sort((a, b) => a - b);

    expect(ffb.boundaries.size).toBe(3);
    expect(lengths).toEqual([1, 3, 3]);
  });

  test("on a dcel of 3 adjacent squares returns 5 FaceFaceBoundaryList with 5 entries and the correct number of Edges", function () {
    const json = JSON.parse(
      readFileSync(
        path.resolve("test/data/shapes/3plgn-adjacent.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    const ffb = new FaceFaceBoundaryList(dcel);
    const lengths = Array.from(ffb.boundaries.values())
      .map((b) => b.edges.length)
      .sort((a, b) => a - b);

    expect(ffb.boundaries.size).toBe(5);
    expect(lengths).toEqual([1, 1, 2, 3, 3]);
  });
});

describe("The Face-Face-Boundary", function () {
  test("consists of edges which all belong to the same face", function () {
    const dcel = Dcel.fromSubdivision(
      Subdivision.fromCoordinates([
        [
          [
            [
              [-3, 3],
              [0, -2],
              [3, 2],
            ],
          ],
        ],
      ]),
    );
    const schematization = new CSchematization();
    const constrained = schematization.constrainAngles(dcel);
    const ffbl = new FaceFaceBoundaryList(constrained);
    const faces = ffbl
      .getBoundaries()
      .map((ffb) => new Set(ffb.edges.map((e) => e.face?.uuid)));
    expect(faces.every((face) => face.size === 1)).toBe(true);
  });
});

describe("getMinimalConfigurationPair()", function () {
  test("on a test file returns the expected contraction pair.", function () {
    const json = JSON.parse(
      readFileSync(
        path.resolve("test/data/shapes/smallest-contraction.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    const ffb = new FaceFaceBoundaryList(dcel);
    const configurations = new ConfigurationGenerator().run(dcel);
    const pair = ffb.getMinimalConfigurationPair(configurations);

    expect(pair?.contraction.area).toBe(0.5);
    const inner = pair?.contraction.configuration.innerEdge;
    expect(inner).toBeDefined();
    expect(inner?.tail?.x).toBe(9.5);
    expect(inner?.tail?.y).toBe(7);
    expect(inner?.head?.x).toBe(9.5);
    expect(inner?.head?.y).toBe(8);
    expect(pair?.compensation?.area).toBeGreaterThan(0.5);
    const compensationInner = pair?.compensation?.configuration.innerEdge;
    expect(compensationInner).toBeDefined();
    expect(compensationInner?.tail?.x).toBe(10);
    expect(compensationInner?.tail?.y).toBe(8);
    expect(compensationInner?.head?.x).toBe(10);
    expect(compensationInner?.head?.y).toBe(10);
  });

  test("on a test file returns the expected contraction pair.", function () {
    const json = JSON.parse(
      readFileSync(
        path.resolve("test/data/shapes/smallest-contraction-2.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    const configurations = new ConfigurationGenerator().run(dcel);
    const ffb = new FaceFaceBoundaryListGenerator().run(dcel);
    const pair = ffb.getMinimalConfigurationPair(configurations);

    expect(pair?.contraction.area).toBe(0.5);
    const inner2 = pair?.contraction.configuration.innerEdge;
    expect(inner2).toBeDefined();
    expect(inner2?.tail?.x).toBe(10.5);
    expect(inner2?.tail?.y).toBe(7);
    expect(inner2?.head?.x).toBe(10.5);
    expect(inner2?.head?.y).toBe(8);
    expect(pair?.compensation?.area).toBeGreaterThan(0.5);
    const compensationInner2 = pair?.compensation?.configuration.innerEdge;
    expect(compensationInner2).toBeDefined();
    expect(compensationInner2?.tail?.x).toBe(10);
    expect(compensationInner2?.tail?.y).toBe(8);
    expect(compensationInner2?.head?.x).toBe(10);
    expect(compensationInner2?.head?.y).toBe(10);
  });

  //TODO: add test where no complementary exists for smallest contraction
});
