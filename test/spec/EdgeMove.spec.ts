import fs from "fs";
import path from "path";
import ConfigurationPair from "@/src/c-oriented-schematization/ConfigurationPair";
import Dcel from "@/src/DCEL/Dcel";
import FaceFaceBoundaryList from "@/src/c-oriented-schematization/FaceFaceBoundaryList";

describe("createConfigurations()", function () {
  it("adds configuration to all edges which are possible candidates for edge moves (which endpoints are of degree 3 or less).", function () {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/aligned-deviating.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel.preProcess();
    dcel.constrainAngles();
    dcel.createConfigurations();

    const verticesDegree4 = dcel
      .getVertices()
      .filter((v) => v.edges.length === 4);

    const edgesDegree4 = dcel
      .getHalfEdges()
      .filter((e) => e.getEndpoints()?.some((v) => v.edges.length > 3));

    const configurationCount = dcel
      .getHalfEdges()
      .filter((e) => e.configuration != undefined).length;

    expect(verticesDegree4.length).toBe(1);
    expect(edgesDegree4.length).toBe(8);
    expect(configurationCount).toBe(
      dcel.getHalfEdges().length - edgesDegree4.length,
    );
  });
});

describe("doEdgeMove() removes first all collinear points (contraction area 0)", function () {
  it("on a square shape", function () {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/smallest-contraction-1a.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel.splitEdges(5);
    dcel.createConfigurations();
    dcel.faceFaceBoundaryList = new FaceFaceBoundaryList(dcel);
    let contractionArea = 0;

    for (let index = 0; index < 9; index++) {
      const pair = dcel.faceFaceBoundaryList.getMinimalConfigurationPair();
      const area = pair?.contraction.area;
      if (area && area > contractionArea) contractionArea = area;
      pair?.doEdgeMove();
    }
    expect(contractionArea).toEqual(0);
  });
});

describe("doEdgeMove()", function () {
  xit("for the test case 'smallest-contraction'", function () {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/smallest-contraction.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel.faceFaceBoundaryList = new FaceFaceBoundaryList(dcel);
    const originalArea = dcel.getArea();
    dcel.createConfigurations();
    const pair = dcel.faceFaceBoundaryList
      .getBoundaries()[0]
      .getMinimalConfigurationPair();
    pair?.doEdgeMove();
    const newArea = dcel.getArea();

    expect(dcel.getBoundedFaces()[0].getEdges()[2].toString()).toBe(
      "10.5/1->10/1",
    );
    expect(dcel.getBoundedFaces()[0].getEdges()[3].toString()).toBe(
      "10/1->10/7",
    );
    expect(dcel.getBoundedFaces()[0].getEdges()[4].toString()).toBe(
      "10/7->10/8",
    );
    expect(dcel.getBoundedFaces()[0].getEdges()[5].toString()).toBe(
      "10/8->10/10",
    );
    expect(pair?.contraction.area).toEqual(0.5);
    expect(originalArea).toEqual(newArea);
  });

  xit("for the test case 'smallest-contraction-2", function () {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/smallest-contraction-2.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    const originalArea = dcel.getArea();
    dcel.createConfigurations();
    dcel.faceFaceBoundaryList = new FaceFaceBoundaryList(dcel);
    const pair = dcel.faceFaceBoundaryList.getMinimalConfigurationPair();
    pair?.doEdgeMove();
    const newArea = dcel.getArea();

    expect(dcel.halfEdges.size / 2).toEqual(10);
    expect(dcel.vertices.size).toEqual(10);
    expect(originalArea).toEqual(newArea);
  });

  it("for the test case 'contractions-equal'", function () {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/contractions-equal.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel.faceFaceBoundaryList = new FaceFaceBoundaryList(dcel);
    const originalArea = dcel.getArea();
    dcel.createConfigurations();
    const pair = dcel.faceFaceBoundaryList
      .getBoundaries()[0]
      .getMinimalConfigurationPair();
    pair?.doEdgeMove();
    const newArea = dcel.getArea();

    const edges = dcel
      .getBoundedFaces()[0]
      .getEdges()
      .map((e) => e.toString());

    expect(edges[0]).toBe("0/0->4/0");
    expect(edges[1]).toBe("4/0->4/2");
    expect(edges[2]).toBe("4/2->2.5/2");
    expect(edges[3]).toBe("2.5/2->2.5/3");
    expect(edges[4]).toBe("2.5/3->2.5/4");
    expect(edges[5]).toBe("2.5/4->0/4");
    expect(edges[6]).toBe("0/4->0/0");
    expect(pair?.contraction.area).toEqual(1);
    expect(originalArea).toEqual(newArea);
  });

  it("for contractions with area 0 (3 collinear points)", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/square.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel.getBoundedFaces()[0].getEdges()[0].subdivide();

    dcel.createConfigurations();
    const ffb = (dcel.faceFaceBoundaryList = new FaceFaceBoundaryList(dcel));
    const boundary = ffb.boundaries.values().next().value;
    const pair = boundary.getMinimalConfigurationPair() as ConfigurationPair;
    pair.doEdgeMove();

    expect(dcel.getBoundedFaces()[0].getEdges().length).toBe(4);
    expect(dcel.getHalfEdges().length).toBe(8);
    expect(dcel.getVertices().length).toBe(4);
  });

  it("for contractions with area 0 (4 collinear points)", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/square.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel.getBoundedFaces()[0].getEdges()[0].subdivide()?.subdivide();

    dcel.createConfigurations();
    const ffb = (dcel.faceFaceBoundaryList = new FaceFaceBoundaryList(dcel));
    const boundary = ffb.boundaries.values().next().value;
    const pair = boundary.getMinimalConfigurationPair() as ConfigurationPair;
    pair.doEdgeMove();

    expect(dcel.getBoundedFaces()[0].getEdges().length).toBe(5);
    expect(dcel.getHalfEdges().length).toBe(10);
    expect(dcel.getVertices().length).toBe(5);
  });
});
