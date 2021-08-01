import fs from "fs";
import path from "path";
import Configuration, { Junction } from "../src/lib/c-oriented-schematization/Configuration";
import Dcel from "../src/lib/DCEL/Dcel";
import Vertex from "../src/lib/DCEL/Vertex";

describe("createConfigurations()", function () {
  it("adds configuration to all edges which are possible candidates for edge moves (which endpoints are of degree 3 or less).", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("data/shapes/aligned-deviating.json"), "utf8")
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel.schematize();

    const verticesDegree4 = dcel.getVertices().filter((v) => v.edges.length === 4);

    const edgesDegree4 = dcel
      .getHalfEdges()
      .filter((e) => e.getEndpoints()?.some((v) => v.edges.length > 3));

    const configurationCount = dcel
      .getHalfEdges()
      .filter((e) => e.configuration != undefined).length;

    expect(verticesDegree4.length).toBe(1);
    expect(edgesDegree4.length).toBe(8);
    expect(configurationCount).toBe(dcel.getHalfEdges().length - edgesDegree4.length);
  });
});

describe("getJunctionType() determines the type of a junction in respect to the inneredge", function () {
  let dcel: Dcel;
  beforeEach(function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("data/shapes/edge-move-test.json"), "utf8")
    );
    dcel = Dcel.fromGeoJSON(json);
  });

  it("for a junction of type A.", function () {
    const edge = dcel.getHalfEdges()[2];
    const c = new Configuration(edge);
    const junction = dcel.findVertex(2, 0) as Vertex;

    expect(c.getJunctionType(junction)).toBe(Junction.A);
  });

  it("for a junction of type B.", function () {
    const edge = dcel.getHalfEdges()[6];
    const c = new Configuration(edge);
    const junction = dcel.findVertex(1, 2) as Vertex;

    expect(c.getJunctionType(junction)).toBe(Junction.B);
  });

  it("for a configuration with junctions of type A and C.", function () {
    const edge = dcel.getHalfEdges()[14];
    const c = new Configuration(edge);
    const junction = dcel.findVertex(3, 2) as Vertex;
    const junction2 = dcel.findVertex(3, 0) as Vertex;

    expect(c.getJunctionType(junction)).toBe(Junction.C);
    expect(c.getJunctionType(junction2)).toBe(Junction.A);
  });
});
