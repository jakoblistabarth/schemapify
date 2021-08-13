import fs from "fs";
import path from "path";
import Dcel from "../src/lib/DCEL/Dcel";
import FaceFaceBoundaryList from "../src/lib/c-oriented-schematization/FaceFaceBoundaryList";
import ConfigurationPair from "../src/lib/c-oriented-schematization/ConfigurationPair";

describe("doEdgeMove()", function () {
  it("modifies a dcel as expected.", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("data/shapes/smallest-contraction.json"), "utf8")
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel.faceFaceBoundaryList = new FaceFaceBoundaryList(dcel);
    dcel.createConfigurations();
    const pair = dcel.faceFaceBoundaryList.getBoundaries()[0].getMinimalConfigurationPair();
    pair?.doEdgeMove();

    expect(dcel.getBoundedFaces()[0].getEdges()[2].toString()).toBe("10.5/1->10/1");
    expect(dcel.getBoundedFaces()[0].getEdges()[3].toString()).toBe("10/1->10/7");
    expect(dcel.getBoundedFaces()[0].getEdges()[4].toString()).toBe("10/7->10/8");
    expect(dcel.getBoundedFaces()[0].getEdges()[5].toString()).toBe("10/8->10/10");
  });

  it("for contractions with area 0 (3 collinear points)", function () {
    const json = JSON.parse(fs.readFileSync(path.resolve("data/shapes/square.json"), "utf8"));
    const dcel = Dcel.fromGeoJSON(json);
    dcel.getBoundedFaces()[0].getEdges()[0].subdivide();

    dcel.createConfigurations();
    const ffb = (dcel.faceFaceBoundaryList = new FaceFaceBoundaryList(dcel));
    const boundary = [...ffb.boundaries].map(([k, v]) => v)[0];
    const pair = boundary.getMinimalConfigurationPair() as ConfigurationPair;
    pair.doEdgeMove();

    expect(dcel.getBoundedFaces()[0].getEdges().length).toBe(4);
    expect(dcel.getHalfEdges().length).toBe(8);
    expect(dcel.getVertices().length).toBe(4);
  });

  it("for contractions with area 0 (4 collinear points)", function () {
    const json = JSON.parse(fs.readFileSync(path.resolve("data/shapes/square.json"), "utf8"));
    const dcel = Dcel.fromGeoJSON(json);
    dcel.getBoundedFaces()[0].getEdges()[0].subdivide()?.subdivide();

    dcel.createConfigurations();
    const ffb = (dcel.faceFaceBoundaryList = new FaceFaceBoundaryList(dcel));
    const boundary = [...ffb.boundaries].map(([k, v]) => v)[0];
    const pair = boundary.getMinimalConfigurationPair() as ConfigurationPair;
    pair.doEdgeMove();

    expect(dcel.getBoundedFaces()[0].getEdges().length).toBe(5);
    expect(dcel.getHalfEdges().length).toBe(10);
    expect(dcel.getVertices().length).toBe(5);
  });
});

describe("doEdgeMove() on a minimal configuration pair does the expected edgemove correctly", function () {
  it("for the test case 'smallest-contraction", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("data/shapes/smallest-contraction.json"), "utf8")
    );
    const dcel = Dcel.fromGeoJSON(json);
    const originalArea = dcel.getArea();
    dcel.createConfigurations();
    dcel.faceFaceBoundaryList = new FaceFaceBoundaryList(dcel);
    const contractionEdges: string[] = [];
    const pair = dcel.faceFaceBoundaryList.getMinimalConfigurationPair();
    const contractionEdge = pair?.contraction.configuration.innerEdge.toString();
    const compensationEdge = pair?.compensation?.configuration.innerEdge.toString();
    pair?.doEdgeMove();
    const newArea = dcel.getArea();

    expect(contractionEdge).toEqual("9.5/7->9.5/8");
    expect(compensationEdge).toEqual("11/0->11/1");
    expect(pair?.contraction.area).toEqual(0.5);
    expect(originalArea).toEqual(newArea);
  });

  it("for the test case 'smallest-contraction-2", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("data/shapes/smallest-contraction-2.json"), "utf8")
    );
    const dcel = Dcel.fromGeoJSON(json);
    const originalArea = dcel.getArea();
    dcel.createConfigurations();
    dcel.faceFaceBoundaryList = new FaceFaceBoundaryList(dcel);
    const contractionEdges: string[] = [];
    const pair = dcel.faceFaceBoundaryList.getMinimalConfigurationPair();
    const contractionEdge = pair?.contraction.configuration.innerEdge.toString();
    const compensationEdge = pair?.compensation?.configuration.innerEdge.toString();
    pair?.doEdgeMove();
    const newArea = dcel.getArea();

    expect(contractionEdge).toEqual("10.5/7->10.5/8");
    expect(compensationEdge).toEqual("9/2->9/3");
    expect(pair?.contraction.area).toEqual(0.5);
    expect(originalArea).toEqual(newArea);
  });
});

describe("recursive doEdgeMove() on minimal configuration pairs", function () {
  it("returns the expected contraction pair for the second, third, and fourth edge move.", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("data/shapes/smallest-contraction.json"), "utf8")
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel.createConfigurations();
    dcel.faceFaceBoundaryList = new FaceFaceBoundaryList(dcel);
    const contractionEdges: string[] = [];

    for (let index = 0; index < 10; index++) {
      const pair = dcel.faceFaceBoundaryList.getMinimalConfigurationPair();
      const contractionEdge = pair?.contraction.configuration.innerEdge;
      if (contractionEdge) contractionEdges.push(contractionEdge?.toString() as string);
      pair?.doEdgeMove();
    }
    expect(contractionEdges).toEqual(["9.5/7->9.5/8", "10/1->10/7", "10/8->10/10"]);
  });
});
