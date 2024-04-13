import fs from "fs";
import path from "path";
import Dcel from "@/src/DCEL/Dcel";
import FaceFaceBoundaryList from "@/src/c-oriented-schematization/FaceFaceBoundaryList";
import ConfigurationPair from "@/src/c-oriented-schematization/ConfigurationPair";
import MultiPolygon from "@/src/geometry/MultiPolygon";
import CSchematization from "@/src/c-oriented-schematization/CSchematization";

describe("create()", function () {
  it("on a dcel of 2 adjacent squares returns FaceFaceBoundaryList with 3 entries and the correct number of Edges", function () {
    const json = JSON.parse(
      fs.readFileSync(
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

  it("on a dcel of 3 adjacent squares returns 5 FaceFaceBoundaryList with 5 entries and the correct number of Edges", function () {
    const json = JSON.parse(
      fs.readFileSync(
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
  it("consists of edges which all belong to the same face", function () {
    const dcel = Dcel.fromMultiPolygons([
      MultiPolygon.fromCoordinates([
        [
          [
            [-3, 3],
            [0, -2],
            [3, 2],
          ],
        ],
      ]),
    ]);
    const schematization = new CSchematization(dcel);
    schematization.schematize();
    const ffbl = new FaceFaceBoundaryList(dcel);
    const faces = ffbl
      .getBoundaries()
      .map((ffb) => new Set(ffb.edges.map((e) => e.face?.uuid)));
    expect(faces.every((face) => face.size === 1)).toBeTruthy();
  });
});

describe("getMinimalConfigurationPair()", function () {
  xit("on a test file returns the expected contraction pair.", function () {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/smallest-contraction.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    const schematization = new CSchematization(dcel);
    schematization.createConfigurations();
    const ffb = (dcel.faceFaceBoundaryList = new FaceFaceBoundaryList(dcel));
    const boundary = ffb.boundaries.values().next().value;
    const pair = boundary.getMinimalConfigurationPair() as ConfigurationPair;

    expect(pair.contraction.area).toBe(0.5);
    expect(pair.contraction.configuration.innerEdge.toString()).toBe(
      "9.5/7->9.5/8",
    );
    expect(pair.compensation?.area).toBeGreaterThan(0.5);
    expect(pair.compensation?.configuration.innerEdge.toString()).toBe(
      "11/0->11/1",
    );
  });

  xit("on a test file returns the expected contraction pair.", function () {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/smallest-contraction-2.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    const schematization = new CSchematization(dcel);
    schematization.createConfigurations();
    const ffb = (dcel.faceFaceBoundaryList = new FaceFaceBoundaryList(dcel));
    const boundary = ffb.boundaries.values().next().value;
    const pair = boundary.getMinimalConfigurationPair() as ConfigurationPair;

    expect(pair.contraction.area).toBe(0.5);
    expect(pair.contraction.configuration.innerEdge.toString()).toBe(
      "10.5/7->10.5/8",
    );
    expect(pair.compensation?.area).toBeGreaterThan(0.5);
    expect(pair.compensation?.configuration.innerEdge.toString()).toBe(
      "9/2->9/3",
    );
  });

  //TODO: add test where no complementary exists for smallest contraction
});
