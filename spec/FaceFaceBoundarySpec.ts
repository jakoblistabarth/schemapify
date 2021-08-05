import fs from "fs";
import path from "path";
import Dcel from "../src/lib/DCEL/Dcel";
import FaceFaceBoundaryList from "../src/lib/c-oriented-schematization/FaceFaceBoundaryList";
import Contraction from "../src/lib/c-oriented-schematization/Contraction";

describe("create()", function () {
  it("on a dcel of 2 adjacent squares returns FaceFaceBoundaryList with 3 entries and the correct number of Edges", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("data/shapes/2plgn-adjacent.json"), "utf8")
    );
    const dcel = Dcel.fromGeoJSON(json);
    const ffb = new FaceFaceBoundaryList(dcel);
    const lengths = [...ffb.boundaries].map(([k, b]) => b.edges.length).sort((a, b) => a - b);

    expect(ffb.boundaries.size).toBe(3);
    expect(lengths).toEqual([1, 3, 3]);
  });

  it("on a dcel of 3 adjacent squares returns 5 FaceFaceBoundaryList with 5 entries and the correct number of Edges", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("data/shapes/3plgn-adjacent.json"), "utf8")
    );
    const dcel = Dcel.fromGeoJSON(json);
    const ffb = new FaceFaceBoundaryList(dcel);
    const lengths = [...ffb.boundaries].map(([k, b]) => b.edges.length).sort((a, b) => a - b);

    expect(ffb.boundaries.size).toBe(5);
    expect(lengths).toEqual([1, 1, 2, 3, 3]);
  });
});

describe("getMinimalConfigurationPair()", function () {
  it("on a test file returns the expected contraction pair.", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("data/shapes/smallestContraction.json"), "utf8")
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel.createConfigurations();
    const ffb = (dcel.faceFaceBoundaryList = new FaceFaceBoundaryList(dcel));
    const boundary = [...ffb.boundaries].map(([k, v]) => v)[0];
    const pair = boundary.getMinimalConfigurationPair() as [Contraction, Contraction];

    expect(pair[0].area).toBe(0.5);
    expect(pair[0].configuration.innerEdge.toString()).toBe("9.5/7->9.5/8");
    expect(pair[1].area).toBeGreaterThan(0.5);
    expect(pair[1].configuration.innerEdge.toString()).toBe("10/8->10/10");
  });

  it("on a test file returns the expected contraction pair.", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("data/shapes/smallestContraction-2.json"), "utf8")
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel.createConfigurations();
    const ffb = (dcel.faceFaceBoundaryList = new FaceFaceBoundaryList(dcel));
    const boundary = [...ffb.boundaries].map(([k, v]) => v)[0];
    const pair = boundary.getMinimalConfigurationPair() as [Contraction, Contraction];

    expect(pair[0].area).toBe(0.1875);
    expect(pair[0].configuration.innerEdge.toString()).toBe("0/0->0.25/0");
    expect(pair[1].area).toBeGreaterThan(0.1875);
    expect(pair[1].configuration.innerEdge.toString()).toBe("10.75/0.75->10.75/0.25");
  });

  //TODO: add test where no complementary exists for smalles contraction
});
