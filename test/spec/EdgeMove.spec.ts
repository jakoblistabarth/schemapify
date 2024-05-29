import fs from "fs";
import path from "path";
import Dcel from "@/src/Dcel/Dcel";
import FaceFaceBoundaryList from "@/src/c-oriented-schematization/FaceFaceBoundaryList";
import CSchematization from "@/src/c-oriented-schematization/CSchematization";

describe("createConfigurations()", function () {
  it("adds configuration to all edges which are possible candidates for edge moves (which endpoints are of degree 3 or less).", function () {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/aligned-deviating.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    const schematization = new CSchematization();
    schematization.run(dcel);

    const verticesDegree4 = dcel
      .getVertices()
      .filter((v) => v.edges.length === 4);

    const edgesDegree4 = dcel
      .getHalfEdges()
      .filter((e) => e.endpoints?.some((v) => v.edges.length > 3));

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
    const schematization = new CSchematization();
    schematization.createConfigurations(dcel);
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
    const schematization = new CSchematization();
    schematization.createConfigurations(dcel);
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
    const schematization = new CSchematization();
    schematization.createConfigurations(dcel);
    const pair = dcel.faceFaceBoundaryList
      .getBoundaries()[0]
      .getMinimalConfigurationPair();
    const originalContractionArea = pair?.contraction.area;
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
    expect(originalContractionArea).toEqual(1);
    expect(originalArea).toEqual(newArea);
  });
});
