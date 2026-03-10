import Dcel from "@/src/Dcel/Dcel";
import CSchematization from "@/src/c-oriented-schematization/CSchematization";
import ConfigurationGenerator from "@/src/c-oriented-schematization/ConfigurationGenerator";
import EdgeMoveProcessor from "@/src/c-oriented-schematization/EdgeMoveProcessor";
import FaceFaceBoundaryListGenerator from "@/src/c-oriented-schematization/FaceFaceBoundaryListGenerator";
import fs from "fs";
import path from "path";
import { describe, expect, test } from "vitest";

describe("createConfigurations()", function () {
  test("adds configuration to all edges which are possible candidates for edge moves (which endpoints are of degree 3 or less).", function () {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/aligned-deviating.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    const schematization = new CSchematization();
    const dcelConstrained = schematization.constrainAngles(dcel);

    const verticesDegree4 = dcelConstrained
      .getVertices()
      .filter((v) => v.edges.length === 4);

    const edgesDegree4 = dcelConstrained
      .getHalfEdges()
      .filter((e) => e.endpoints?.some((v) => v.edges.length > 3));

    const configurations = new ConfigurationGenerator().run(dcelConstrained);
    const configurationCount = configurations.size;

    expect(verticesDegree4.length).toBe(1);
    expect(edgesDegree4.length).toBe(8);
    expect(configurationCount).toBe(
      dcelConstrained.getHalfEdges().length - edgesDegree4.length,
    );
  });
});

describe("doEdgeMove()", function () {
  // TODO: fix edgeMove first
  test.fails(
    "(recursive) on respective minimal configurations returns the expected contraction pair for the second, third, and fourth edge move.",
    function () {
      const json = JSON.parse(
        fs.readFileSync(
          path.resolve("test/data/shapes/smallest-contraction.json"),
          "utf8",
        ),
      );
      const dcel = Dcel.fromGeoJSON(json);
      const configurations = new ConfigurationGenerator().run(dcel);
      const ffb = new FaceFaceBoundaryListGenerator().run(dcel);
      const contractionEdges: string[] = [];

      for (let index = 0; index < 10; index++) {
        const pair = ffb.getMinimalConfigurationPair(configurations);
        const contractionEdge = pair?.contraction.configuration.innerEdge;
        if (contractionEdge) contractionEdges.push(contractionEdge?.uuid);
        // TODO: fix this
        // pair?.doEdgeMove(dcel, configurations, ffb.configurations);
      }
      expect(contractionEdges).toEqual([
        "9.5|7->9.5|8",
        "10|1->10|7",
        "10|8->10|10",
      ]);
    },
  );

  test.fails("for the test case 'smallest-contraction'", function () {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/smallest-contraction.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    const ffb = new FaceFaceBoundaryListGenerator().run(dcel);
    const configurations = new ConfigurationGenerator().run(dcel);
    const originalArea = dcel.getArea();
    const pair = ffb
      .getBoundaries()[0]
      .getMinimalConfigurationPair(configurations);
    const { dcel: newDcel } = new EdgeMoveProcessor(ffb, configurations).run(
      dcel,
    );
    const newArea = newDcel.getArea();

    expect(dcel.getBoundedFaces()[0].getEdges()[2].tail.xy).toEqual([10.5, 1]);
    expect(dcel.getBoundedFaces()[0].getEdges()[2].head?.xy).toEqual([10, 1]);
    expect(dcel.getBoundedFaces()[0].getEdges()[3].tail.xy).toEqual([10, 1]);
    expect(dcel.getBoundedFaces()[0].getEdges()[3].head?.xy).toEqual([10, 7]);
    expect(dcel.getBoundedFaces()[0].getEdges()[4].tail.xy).toEqual([10, 7]);
    expect(dcel.getBoundedFaces()[0].getEdges()[4].head?.xy).toEqual([10, 8]);
    expect(dcel.getBoundedFaces()[0].getEdges()[4].tail.xy).toEqual([10, 8]);
    expect(dcel.getBoundedFaces()[0].getEdges()[4].head?.xy).toEqual([10, 10]);
    expect(pair?.contraction.area).toEqual(0.5);
    expect(originalArea).toEqual(newArea);
  });

  test.fails("for the test case 'smallest-contraction-2", function () {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/smallest-contraction-2.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    const originalArea = dcel.getArea();
    const configurations = new ConfigurationGenerator().run(dcel);
    const ffb = new FaceFaceBoundaryListGenerator().run(dcel);
    const { dcel: newDcel } = new EdgeMoveProcessor(ffb, configurations).run(
      dcel,
    );
    const newArea = newDcel.getArea();

    expect(newDcel.halfEdges.size / 2).toEqual(10);
    expect(newDcel.vertices.size).toEqual(10);
    expect(originalArea).toEqual(newArea);
  });

  test("for the test case 'contractions-equal'", function () {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/contractions-equal.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    const originalArea = dcel.getArea();
    const configurations = new ConfigurationGenerator().run(dcel);
    const ffb = new FaceFaceBoundaryListGenerator().run(dcel);
    const pair = ffb
      .getBoundaries()[0]
      .getMinimalConfigurationPair(configurations);
    const originalContractionArea = pair?.contraction.area;
    const { dcel: newDcel } = new EdgeMoveProcessor(ffb, configurations).run(
      dcel,
    );
    const newArea = newDcel.getArea();

    const edges = newDcel
      .getBoundedFaces()[0]
      .getEdges()
      .map((e) => ({ tail: e.tail.xy, head: e.head?.xy }));

    expect(edges[0].tail).toEqual([0, 0]);
    expect(edges[0].head).toEqual([4, 0]);
    expect(edges[1].tail).toEqual([4, 0]);
    expect(edges[1].head).toEqual([4, 2]);
    expect(edges[2].tail).toEqual([4, 2]);
    expect(edges[2].head).toEqual([2.5, 2]);
    expect(edges[3].tail).toEqual([2.5, 2]);
    expect(edges[3].head).toEqual([2.5, 4]);
    expect(edges[4].tail).toEqual([2.5, 4]);
    expect(edges[4].head).toEqual([0, 4]);
    expect(edges[5].tail).toEqual([0, 4]);
    expect(edges[5].head).toEqual([0, 0]);
    expect(originalContractionArea).toEqual(1);
    expect(originalArea).toEqual(newArea);
  });
});
