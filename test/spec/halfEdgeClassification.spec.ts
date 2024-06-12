import fs from "fs";
import path from "path";
import CRegular from "@/src/c-oriented-schematization/CRegular";
import Dcel from "@/src/Dcel/Dcel";
import { Orientation } from "@/src/c-oriented-schematization/HalfEdgeClassGenerator";
import { createEdgeVertexSetup, TestSetup } from "./test-setup";
import { style } from "@/src/c-oriented-schematization/schematization.style";
import C from "@/src/c-oriented-schematization/C";
import CSchematization from "@/src/c-oriented-schematization/CSchematization";

describe("isDeviating()", function () {
  let s: TestSetup;
  let c: C;

  beforeEach(function () {
    s = createEdgeVertexSetup();
    ({ c } = style);
  });

  it("returns true for an deviating edge", function () {
    s.directions.od53.assignedDirection = 2;
    expect(s.directions.od53.isDeviating(c.sectors)).toBe(true);
  });

  it("returns true for an deviating edge", function () {
    s.directions.od53.assignedDirection = 3;
    expect(s.directions.od53.isDeviating(c.sectors)).toBe(true);
    expect(s.directions.od53.isDeviating(new CRegular(4).sectors)).toBe(true);
  });

  it("returns false for a basic edge", function () {
    s.directions.od53.assignedDirection = 1;
    expect(s.directions.od53.isDeviating(c.sectors)).toBe(false);
    expect(s.directions.od53.isDeviating(new CRegular(4).sectors)).toBe(false);
  });

  it("returns false for a basic edge", function () {
    s.directions.od333.assignedDirection = 0;
    expect(s.directions.od333.isDeviating(c.sectors)).toBe(false);
    expect(s.directions.od333.isDeviating(new CRegular(4).sectors)).toBe(false);
  });

  it("returns false for a basic edge", function () {
    s.directions.od53.assignedDirection = 0;
    expect(s.directions.od53.isDeviating(c.sectors)).toBe(false);
  });

  it("returns false for a for a basic aligned edge", function () {
    s.directions.od90.assignedDirection = 1;
    expect(s.directions.od90.isDeviating(c.sectors)).toBe(false);
  });

  it("returns true for a for a deviating aligned edge", function () {
    s.directions.od90.assignedDirection = 2;
    expect(s.directions.od90.isDeviating(c.sectors)).toBe(true);
  });

  it("returns false for a for a basic aligned edge", function () {
    s.directions.od90.assignedDirection = 2;

    expect(s.directions.od90.isDeviating(new CRegular(4).sectors)).toBe(false);
  });

  it("returns false for a for a basic aligned edge", function () {
    s.directions.od315.assignedDirection = 7;

    expect(s.directions.od315.isDeviating(new CRegular(4).sectors)).toBe(false);
  });
});

describe("The getter significantVertex()", function () {
  let s: TestSetup;
  beforeEach(function () {
    s = createEdgeVertexSetup();
  });

  it("returns an significant endpoint if one is specified", function () {
    const significantVertex = s.directions.od53.significantVertex;
    expect(significantVertex?.significant).toBe(true);
  });
  it("returns null if none of its endpoints are significant", function () {
    s.o.significant = false;
    expect(s.directions.od53.significantVertex).toBeUndefined();
  });
});

describe("Given the examples in the paper of Buchin et al., classify() works as expected on example", function () {
  let s: TestSetup;
  let c: C;

  beforeEach(function () {
    s = createEdgeVertexSetup();
    ({ c } = style);
  });

  it("a", function () {
    s.o.edges.push(s.directions.od53, s.directions.od217);
    s.directions.od53.classify(c);
    s.directions.od217.classify(c);

    expect(s.directions.od53.class).toBe(Orientation.UB);
    expect(s.directions.od217.class).toBe(Orientation.UB);
  });

  it("b", function () {
    s.o.edges.push(s.directions.od53, s.directions.od180, s.directions.od270);
    s.directions.od53.classify(c);
    s.directions.od180.classify(c);
    s.directions.od270.classify(c);

    expect(s.directions.od53.class).toBe(Orientation.UB);
    expect(s.directions.od180.class).toBe(Orientation.AB);
    expect(s.directions.od270.class).toBe(Orientation.AB);
  });

  it("c", function () {
    s.o.edges.push(s.directions.od37, s.directions.od90, s.directions.od104);
    s.directions.od37.classify(c);
    s.directions.od90.classify(c);
    s.directions.od104.classify(c);

    expect(s.directions.od37.class).toBe(Orientation.UB);
    expect(s.directions.od90.class).toBe(Orientation.AB);
    expect(s.directions.od104.class).toBe(Orientation.UB);
  });

  it("d", function () {
    s.o.edges.push(s.directions.od37, s.directions.od53);
    s.directions.od37.classify(c);
    s.directions.od53.classify(c);

    expect(s.directions.od37.class).toBe(Orientation.E);
    expect(s.directions.od53.class).toBe(Orientation.E);
  });

  it("e", function () {
    s.o.edges.push(s.directions.od37, s.directions.od53, s.directions.od76);
    s.directions.od37.classify(c);
    s.directions.od53.classify(c);
    s.directions.od76.classify(c);

    expect(s.directions.od37.class).toBe(Orientation.E);
    expect(s.directions.od53.class).toBe(Orientation.E);
    expect(s.directions.od76.class).toBe(Orientation.UD);
  });

  it("f", function () {
    s.o.edges.push(
      s.directions.od0,
      s.directions.od37,
      s.directions.od53,
      s.directions.od76,
    );
    s.directions.od0.classify(c);
    s.directions.od37.classify(c);
    s.directions.od53.classify(c);
    s.directions.od76.classify(c);

    expect(s.directions.od0.class).toBe(Orientation.AD);
    expect(s.directions.od37.class).toBe(Orientation.E);
    expect(s.directions.od53.class).toBe(Orientation.E);
    expect(s.directions.od76.class).toBe(Orientation.UD);
  });

  it("g", function () {
    s.o.edges.push(
      s.directions.od315,
      s.directions.od333,
      s.directions.od53,
      s.directions.od76,
    );
    s.directions.od315.classify(c);
    s.directions.od333.classify(c);
    s.directions.od53.classify(c);
    s.directions.od76.classify(c);

    expect(s.directions.od315.class).toBe(Orientation.E);
    expect(s.directions.od333.class).toBe(Orientation.E);
    expect(s.directions.od53.class).toBe(Orientation.UB);
    expect(s.directions.od76.class).toBe(Orientation.UD);
  });

  it("h", function () {
    s.o.edges.push(s.directions.od53, s.directions.od217);
    s.directions.od53.classify(new CRegular(4));
    s.directions.od217.classify(new CRegular(4));

    expect(s.directions.od53.class).toBe(Orientation.UB);
    expect(s.directions.od217.class).toBe(Orientation.UB);
  });

  it("i", function () {
    s.o.edges.push(s.directions.od53, s.directions.od180, s.directions.od270);
    s.directions.od53.classify(new CRegular(4));
    s.directions.od180.classify(new CRegular(4));
    s.directions.od270.classify(new CRegular(4));

    expect(s.directions.od53.class).toBe(Orientation.UB);
    expect(s.directions.od180.class).toBe(Orientation.AB);
    expect(s.directions.od270.class).toBe(Orientation.AB);
  });

  it("j", function () {
    s.o.edges.push(s.directions.od53, s.directions.od90, s.directions.od104);
    s.directions.od53.classify(new CRegular(4));
    s.directions.od90.classify(new CRegular(4));
    s.directions.od104.classify(new CRegular(4));

    expect(s.directions.od53.class).toBe(Orientation.UB);
    expect(s.directions.od90.class).toBe(Orientation.AB);
    expect(s.directions.od104.class).toBe(Orientation.UB);
  });

  it("k", function () {
    s.o.edges.push(s.directions.od37, s.directions.od53);
    s.directions.od37.classify(new CRegular(4));
    s.directions.od53.classify(new CRegular(4));

    expect(s.directions.od37.class).toBe(Orientation.UB);
    expect(s.directions.od53.class).toBe(Orientation.UB);
  });

  it("l", function () {
    s.o.edges.push(s.directions.od37, s.directions.od53, s.directions.od76);
    s.directions.od37.classify(new CRegular(4));
    s.directions.od53.classify(new CRegular(4));
    s.directions.od76.classify(new CRegular(4));

    expect(s.directions.od37.class).toBe(Orientation.UB);
    expect(s.directions.od53.class).toBe(Orientation.E);
    expect(s.directions.od76.class).toBe(Orientation.E);
  });

  it("m", function () {
    s.o.edges.push(
      s.directions.od0,
      s.directions.od14,
      s.directions.od53,
      s.directions.od76,
    );
    s.directions.od0.classify(new CRegular(4));
    s.directions.od14.classify(new CRegular(4));
    s.directions.od53.classify(new CRegular(4));
    s.directions.od76.classify(new CRegular(4));

    expect(s.directions.od0.class).toBe(Orientation.AD);
    expect(s.directions.od14.class).toBe(Orientation.UB);
    expect(s.directions.od53.class).toBe(Orientation.E);
    expect(s.directions.od76.class).toBe(Orientation.E);
  });

  it("n", function () {
    s.o.edges.push(
      s.directions.od315,
      s.directions.od333,
      s.directions.od53,
      s.directions.od76,
    );
    s.directions.od315.classify(new CRegular(4));
    s.directions.od333.classify(new CRegular(4));
    s.directions.od53.classify(new CRegular(4));
    s.directions.od76.classify(new CRegular(4));

    expect(s.directions.od315.class).toBe(Orientation.AB);
    expect(s.directions.od333.class).toBe(Orientation.UB);
    expect(s.directions.od53.class).toBe(Orientation.E);
    expect(s.directions.od76.class).toBe(Orientation.E);
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
    schematization.classify(dcel);
    const edgesWithoutAssignedAngles = dcel
      .getHalfEdges()
      .filter((edge) => edge.assignedDirection === undefined);
    const edgesWithoutClassification = dcel
      .getHalfEdges()
      .filter((edge) => edge.class === undefined);
    const edgesWithDivergingClasses = dcel
      .getHalfEdges()
      .filter((edge) => edge.class !== edge.twin?.class);

    expect(edgesWithoutAssignedAngles.length).toBe(0);
    expect(edgesWithDivergingClasses.length).toBe(0);
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
    schematization.classify(dcel);
    const edgesWithoutAssignedAngles = dcel
      .getHalfEdges()
      .filter((edge) => edge.assignedDirection === undefined);
    const edgesWithoutClassification = dcel
      .getHalfEdges()
      .filter((edge) => edge.class === undefined);
    const edgesWithDivergingClasses = dcel
      .getHalfEdges()
      .filter((edge) => edge.class !== edge.twin?.class);

    expect(edgesWithoutAssignedAngles.length).toBe(0);
    expect(edgesWithDivergingClasses.length).toBe(0);
    expect(edgesWithoutClassification.length).toBe(0);
  });
});
