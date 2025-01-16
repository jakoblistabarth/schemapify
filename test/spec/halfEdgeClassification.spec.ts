import CRegular from "@/src/c-oriented-schematization/CRegular";
import CSchematization from "@/src/c-oriented-schematization/CSchematization";
import HalfEdgeClassGenerator, {
  Orientation,
} from "@/src/c-oriented-schematization/HalfEdgeClassGenerator";
import {
  getSignificantVertex,
  isDeviating,
} from "@/src/c-oriented-schematization/HalfEdgeUtils";
import { style } from "@/src/c-oriented-schematization/schematization.style";
import VertexClassGenerator from "@/src/c-oriented-schematization/VertexClassGenerator";
import Dcel from "@/src/Dcel/Dcel";
import Vertex from "@/src/Dcel/Vertex";
import fs from "fs";
import path from "path";
import {
  createEdgeVertexSetup,
  getClassification,
  TestSetup,
} from "./test-setup";

describe("isDeviating()", function () {
  let s: TestSetup;

  beforeEach(function () {
    s = createEdgeVertexSetup();
  });

  it("returns true for an deviating edge", function () {
    const edgeIsDeviating = isDeviating(
      s.directions.od76,
      new CRegular(2).sectors,
      2,
    );
    expect(edgeIsDeviating).toBe(true);
  });

  it("returns true for an deviating edge", function () {
    const edgeIsDeviating = isDeviating(
      s.directions.od53,
      new CRegular(2).sectors,
      2,
    );
    expect(edgeIsDeviating).toBe(true);
  });

  it("returns true for an deviating edge", function () {
    const edgeIsDeviatingC2 = isDeviating(
      s.directions.od53,
      new CRegular(2).sectors,
      3,
    );
    const edgeIsDeviatingC4 = isDeviating(
      s.directions.od53,
      new CRegular(4).sectors,
      3,
    );
    expect(edgeIsDeviatingC2).toBe(true);
    expect(edgeIsDeviatingC4).toBe(true);
  });

  it("returns false for a basic edge", function () {
    const edgeIsDeviatingC2 = isDeviating(
      s.directions.od53,
      new CRegular(2).sectors,
      1,
    );
    const edgeIsDeviatingC4 = isDeviating(
      s.directions.od53,
      new CRegular(4).sectors,
      1,
    );
    expect(edgeIsDeviatingC2).toBe(false);
    expect(edgeIsDeviatingC4).toBe(false);
  });

  it("returns false for a basic edge", function () {
    const edgeIsDeviatingC2 = isDeviating(
      s.directions.od333,
      new CRegular(2).sectors,
      0,
    );
    const edgeIsDeviatingC4 = isDeviating(
      s.directions.od333,
      new CRegular(4).sectors,
      0,
    );
    expect(edgeIsDeviatingC2).toBe(false);
    expect(edgeIsDeviatingC4).toBe(false);
  });

  it("returns false for a basic edge", function () {
    const edgeIsDeviating = isDeviating(
      s.directions.od53,
      new CRegular(2).sectors,
      0,
    );
    expect(edgeIsDeviating).toBe(false);
  });

  it("returns false for a for a basic aligned edge", function () {
    const edgeIsDeviating = isDeviating(
      s.directions.od90,
      new CRegular(2).sectors,
      1,
    );
    expect(edgeIsDeviating).toBe(false);
  });

  it("returns true for a for a deviating aligned edge", function () {
    const edgeIsDeviating = isDeviating(
      s.directions.od90,
      new CRegular(2).sectors,
      2,
    );
    expect(edgeIsDeviating).toBe(true);
  });

  it("returns false for a for a basic aligned edge", function () {
    const edgeIsDeviating = isDeviating(
      s.directions.od90,
      new CRegular(4).sectors,
      2,
    );
    expect(edgeIsDeviating).toBe(false);
  });

  it("returns false for a for a basic aligned edge", function () {
    const edgeIsDeviating = isDeviating(
      s.directions.od315,
      new CRegular(4).sectors,
      7,
    );
    expect(edgeIsDeviating).toBe(false);
  });
});

describe("getSignificantVertex()", function () {
  let s: TestSetup;
  beforeEach(function () {
    s = createEdgeVertexSetup();
  });

  it("returns an significant endpoint if one is specified", function () {
    const significantVertex = getSignificantVertex(s.directions.od53, [
      s.origin.uuid,
    ]);
    expect(significantVertex?.uuid).toBe(Vertex.getKey(0, 0));
  });
  it("returns null if none of its endpoints are significant", function () {
    const significantVertex = getSignificantVertex(s.directions.od53, []);
    expect(significantVertex).toBeUndefined();
  });
});

describe("Given the examples in the paper of Buchin et al., classify() works as expected on example", function () {
  let s: TestSetup;

  beforeEach(function () {
    s = createEdgeVertexSetup();
  });

  it("a", function () {
    const orientations = getClassification(
      s,
      [s.directions.od53, s.directions.od217],
      "orientation",
    );
    expect(orientations).toEqual([Orientation.UB, Orientation.UB]);
  });

  it("b", function () {
    const orientations = getClassification(
      s,
      [s.directions.od53, s.directions.od180, s.directions.od270],
      "orientation",
    );
    expect(orientations).toEqual([
      Orientation.UB,
      Orientation.AB,
      Orientation.AB,
    ]);
  });

  it("c", function () {
    const orientations = getClassification(
      s,
      [s.directions.od37, s.directions.od90, s.directions.od104],
      "orientation",
      { significantVertices: [s.origin.uuid] },
    );
    expect(orientations).toEqual([
      Orientation.UB,
      Orientation.AB,
      Orientation.UB,
    ]);
  });

  it("d", function () {
    const orientations = getClassification(
      s,
      [s.directions.od37, s.directions.od53],
      "orientation",
      { significantVertices: [s.origin.uuid] },
    );
    expect(orientations).toEqual([Orientation.E, Orientation.E]);
  });

  it("e", function () {
    const orientations = getClassification(
      s,
      [s.directions.od37, s.directions.od53, s.directions.od76],
      "orientation",
      { significantVertices: [s.origin.uuid] },
    );
    expect(orientations).toEqual([
      Orientation.E,
      Orientation.E,
      Orientation.UD,
    ]);
  });

  it("f", function () {
    const orientations = getClassification(
      s,
      [
        s.directions.od0,
        s.directions.od37,
        s.directions.od53,
        s.directions.od76,
      ],
      "orientation",
      { significantVertices: [s.origin.uuid] },
    );
    expect(orientations).toEqual([
      Orientation.AD,
      Orientation.E,
      Orientation.E,
      Orientation.UD,
    ]);
  });

  it("g", function () {
    const orientations = getClassification(
      s,
      [
        s.directions.od53,
        s.directions.od76,
        s.directions.od315,
        s.directions.od333,
      ],
      "orientation",
      { significantVertices: [s.origin.uuid] },
    );
    expect(orientations).toEqual([
      Orientation.UB,
      Orientation.UD,
      Orientation.E,
      Orientation.E,
    ]);
  });

  it("h", function () {
    const orientations = getClassification(
      s,
      [s.directions.od53, s.directions.od217],
      "orientation",
      { c: new CRegular(4) },
    );
    expect(orientations).toEqual([Orientation.UB, Orientation.UB]);
  });

  it("i", function () {
    const orientations = getClassification(
      s,
      [s.directions.od53, s.directions.od180, s.directions.od270],
      "orientation",
      { c: new CRegular(4) },
    );
    expect(orientations).toEqual([
      Orientation.UB,
      Orientation.AB,
      Orientation.AB,
    ]);
  });

  it("j", function () {
    const orientations = getClassification(
      s,
      [s.directions.od53, s.directions.od90, s.directions.od104],
      "orientation",
      { significantVertices: [s.origin.uuid], c: new CRegular(4) },
    );
    expect(orientations).toEqual([
      Orientation.UB,
      Orientation.AB,
      Orientation.UB,
    ]);
  });

  it("k", function () {
    const orientations = getClassification(
      s,
      [s.directions.od37, s.directions.od53],
      "orientation",
      { significantVertices: [s.origin.uuid], c: new CRegular(4) },
    );
    expect(orientations).toEqual([Orientation.UB, Orientation.UB]);
  });

  it("l", function () {
    const orientations = getClassification(
      s,
      [s.directions.od37, s.directions.od53, s.directions.od76],
      "orientation",
      { significantVertices: [s.origin.uuid], c: new CRegular(4) },
    );
    expect(orientations).toEqual([
      Orientation.UB,
      Orientation.E,
      Orientation.E,
    ]);
  });

  it("m", function () {
    const orientations = getClassification(
      s,
      [
        s.directions.od0,
        s.directions.od14,
        s.directions.od53,
        s.directions.od76,
      ],
      "orientation",
      { significantVertices: [s.origin.uuid], c: new CRegular(4) },
    );
    expect(orientations).toEqual([
      Orientation.AD,
      Orientation.UB,
      Orientation.E,
      Orientation.E,
    ]);
  });

  it("n", function () {
    const orientations = getClassification(
      s,
      [
        s.directions.od76,
        s.directions.od53,
        s.directions.od315,
        s.directions.od333,
      ],
      "orientation",
      { significantVertices: [s.origin.uuid], c: new CRegular(4) },
    );
    expect(orientations).toEqual([
      Orientation.E,
      Orientation.E,
      Orientation.AB,
      Orientation.UB,
    ]);
  });
});

describe("classifyEdges() in a classification where all edges are classified and a halfedge and its twin share the same class", function () {
  it("on simple test data", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/edge-cases.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);
    const schematization = new CSchematization();
    schematization.preProcess(dcel);
    const significantVertices = new VertexClassGenerator(style.c.sectors).run(
      dcel,
    );
    const classifications = new HalfEdgeClassGenerator(
      style.c,
      significantVertices,
    ).run(dcel);
    const edgesWithoutAssignedAngles = [...classifications.values()].filter(
      (edge) => edge.assignedDirection === undefined,
    );
    const edgesWithoutClassification = [...classifications.values()].filter(
      (edge) => edge.orientation === undefined,
    );
    const edgesWithConflictingClasses = dcel
      .getHalfEdges()
      .filter(
        (edge) =>
          edge.twin &&
          classifications.get(edge.uuid)?.orientation !==
            classifications.get(edge.twin.uuid)?.orientation,
      );

    expect(edgesWithoutAssignedAngles.length).toBe(0);
    expect(edgesWithConflictingClasses.length).toBe(0);
    expect(edgesWithoutClassification.length).toBe(0);
  });

  it("on geo data", function () {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/geodata/ne_50m_africa_admin0-s20.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    const schematization = new CSchematization();
    schematization.preProcess(dcel);
    const significantVertices = new VertexClassGenerator(style.c.sectors).run(
      dcel,
    );
    const classifications = new HalfEdgeClassGenerator(
      style.c,
      significantVertices,
    ).run(dcel);
    const edgesWithoutAssignedAngles = [...classifications.values()].filter(
      (edge) => edge.assignedDirection === undefined,
    );
    const edgesWithoutClassification = [...classifications.values()].filter(
      (edge) => edge.orientation === undefined,
    );
    const edgesWithConflictingClasses = dcel
      .getHalfEdges()
      .filter(
        (edge) =>
          edge.twin &&
          classifications.get(edge.uuid)?.orientation !==
            classifications.get(edge.twin.uuid)?.orientation,
      );

    expect(edgesWithoutAssignedAngles.length).toBe(0);
    expect(edgesWithConflictingClasses.length).toBe(0);
    expect(edgesWithoutClassification.length).toBe(0);
  });
});
