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
import fs from "fs";
import path from "path";
import { beforeEach, describe, expect, test } from "vitest";
import {
  createEdgeVertexSetup,
  getClassification,
  idOr,
  TestSetup,
} from "./test-setup";

describe("isDeviating()", function () {
  let s: TestSetup;

  beforeEach(function () {
    s = createEdgeVertexSetup();
  });

  test("returns true for an deviating edge", function () {
    const edgeIsDeviating = isDeviating(
      s.directions.od76,
      new CRegular(2).sectors,
      2,
    );
    expect(edgeIsDeviating).toBe(true);
  });

  test("returns true for an deviating edge", function () {
    const edgeIsDeviating = isDeviating(
      s.directions.od53,
      new CRegular(2).sectors,
      2,
    );
    expect(edgeIsDeviating).toBe(true);
  });

  test("returns true for an deviating edge", function () {
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

  test("returns false for a basic edge", function () {
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

  test("returns false for a basic edge", function () {
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

  test("returns false for a basic edge", function () {
    const edgeIsDeviating = isDeviating(
      s.directions.od53,
      new CRegular(2).sectors,
      0,
    );
    expect(edgeIsDeviating).toBe(false);
  });

  test("returns false for a for a basic aligned edge", function () {
    const edgeIsDeviating = isDeviating(
      s.directions.od90,
      new CRegular(2).sectors,
      1,
    );
    expect(edgeIsDeviating).toBe(false);
  });

  test("returns true for a for a deviating aligned edge", function () {
    const edgeIsDeviating = isDeviating(
      s.directions.od90,
      new CRegular(2).sectors,
      2,
    );
    expect(edgeIsDeviating).toBe(true);
  });

  test("returns false for a for a basic aligned edge", function () {
    const edgeIsDeviating = isDeviating(
      s.directions.od90,
      new CRegular(4).sectors,
      2,
    );
    expect(edgeIsDeviating).toBe(false);
  });

  test("returns false for a for a basic aligned edge", function () {
    const edgeIsDeviating = isDeviating(
      s.directions.od315,
      new CRegular(4).sectors,
      7,
    );
    expect(edgeIsDeviating).toBe(false);
  });

  test("returns true for a for a deviating aligned edge", function () {
    const edgeIsDeviating = isDeviating(
      s.directions.od90,
      new CRegular(2).sectors,
      2,
    );
    expect(edgeIsDeviating).toBe(true);
  });

  test("returns false for a for a basic aligned edge", function () {
    const edgeIsDeviating = isDeviating(
      s.directions.od90,
      new CRegular(4).sectors,
      2,
    );
    expect(edgeIsDeviating).toBe(false);
  });

  test("returns false for a for a basic aligned edge", function () {
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

  test("returns an significant endpoint if one is specified", function () {
    const significantVertex = getSignificantVertex(s.directions.od53, [
      idOr(s.origin),
    ]);
    expect(significantVertex?.id).toBe(idOr(s.origin));
  });
  test("returns null if none of its endpoints are significant", function () {
    const significantVertex = getSignificantVertex(s.directions.od53, []);
    expect(significantVertex).toBeUndefined();
  });
});

describe("Given the examples in the paper of Buchin et al., classify() works as expected on example", function () {
  let s: TestSetup;

  beforeEach(function () {
    s = createEdgeVertexSetup();
  });

  test("a", function () {
    const orientations = getClassification(
      s,
      [s.directions.od53, s.directions.od217],
      "orientation",
    );
    expect(orientations).toEqual([Orientation.UB, Orientation.UB]);
  });

  test("b", function () {
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

  test("c", function () {
    const orientations = getClassification(
      s,
      [s.directions.od37, s.directions.od90, s.directions.od104],
      "orientation",
      { significantVertices: [idOr(s.origin)] },
    );
    expect(orientations).toEqual([
      Orientation.UB,
      Orientation.AB,
      Orientation.UB,
    ]);
  });

  test("d", function () {
    const orientations = getClassification(
      s,
      [s.directions.od37, s.directions.od53],
      "orientation",
      { significantVertices: [idOr(s.origin)] },
    );
    expect(orientations).toEqual([Orientation.E, Orientation.E]);
  });

  test("e", function () {
    const orientations = getClassification(
      s,
      [s.directions.od37, s.directions.od53, s.directions.od76],
      "orientation",
      { significantVertices: [idOr(s.origin)] },
    );
    expect(orientations).toEqual([
      Orientation.E,
      Orientation.E,
      Orientation.UD,
    ]);
  });

  test("f", function () {
    const orientations = getClassification(
      s,
      [
        s.directions.od0,
        s.directions.od37,
        s.directions.od53,
        s.directions.od76,
      ],
      "orientation",
      { significantVertices: [idOr(s.origin)] },
    );
    expect(orientations).toEqual([
      Orientation.AD,
      Orientation.E,
      Orientation.E,
      Orientation.UD,
    ]);
  });

  test("g", function () {
    const orientations = getClassification(
      s,
      [
        s.directions.od53,
        s.directions.od76,
        s.directions.od315,
        s.directions.od333,
      ],
      "orientation",
      { significantVertices: [idOr(s.origin)] },
    );
    expect(orientations).toEqual([
      Orientation.UB,
      Orientation.UD,
      Orientation.E,
      Orientation.E,
    ]);
  });

  test("h", function () {
    const orientations = getClassification(
      s,
      [s.directions.od53, s.directions.od217],
      "orientation",
      { c: new CRegular(4) },
    );
    expect(orientations).toEqual([Orientation.UB, Orientation.UB]);
  });

  test("i", function () {
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

  test("j", function () {
    const orientations = getClassification(
      s,
      [s.directions.od53, s.directions.od90, s.directions.od104],
      "orientation",
      { significantVertices: [s.origin.id!] },
    );
    expect(orientations).toEqual([
      Orientation.UB,
      Orientation.AB,
      Orientation.UB,
    ]);
  });

  test("k", function () {
    const orientations = getClassification(
      s,
      [s.directions.od37, s.directions.od53],
      "orientation",
      { significantVertices: [idOr(s.origin)], c: new CRegular(4) },
    );
    expect(orientations).toEqual([Orientation.UB, Orientation.UB]);
  });

  test("l", function () {
    const orientations = getClassification(
      s,
      [s.directions.od37, s.directions.od53, s.directions.od76],
      "orientation",
      { significantVertices: [idOr(s.origin)], c: new CRegular(4) },
    );
    expect(orientations).toEqual([
      Orientation.UB,
      Orientation.E,
      Orientation.E,
    ]);
  });

  test("m", function () {
    const orientations = getClassification(
      s,
      [
        s.directions.od0,
        s.directions.od14,
        s.directions.od53,
        s.directions.od76,
      ],
      "orientation",
      { significantVertices: [idOr(s.origin)], c: new CRegular(4) },
    );
    expect(orientations).toEqual([
      Orientation.AD,
      Orientation.UB,
      Orientation.E,
      Orientation.E,
    ]);
  });

  test("n", function () {
    const orientations = getClassification(
      s,
      [
        s.directions.od76,
        s.directions.od53,
        s.directions.od315,
        s.directions.od333,
      ],
      "orientation",
      { significantVertices: [idOr(s.origin)], c: new CRegular(4) },
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
  test("on simple test data", function () {
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
          classifications.get(edge.coordKey ?? "")?.orientation !==
            classifications.get(edge.twin.coordKey ?? "")?.orientation,
      );

    expect(edgesWithoutAssignedAngles.length).toBe(0);
    expect(edgesWithConflictingClasses.length).toBe(0);
    expect(edgesWithoutClassification.length).toBe(0);
  });

  test("on geo data", function () {
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
          classifications.get(edge.coordKey ?? "")?.orientation !==
            classifications.get(edge.twin.coordKey ?? "")?.orientation,
      );

    expect(edgesWithoutAssignedAngles.length).toBe(0);
    expect(edgesWithConflictingClasses.length).toBe(0);
    expect(edgesWithoutClassification.length).toBe(0);
  });
});
