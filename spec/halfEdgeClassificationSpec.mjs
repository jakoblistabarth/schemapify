import Vertex from "../assets/lib/dcel/Vertex.mjs";
import DCEL from "../assets/lib/dcel/Dcel.mjs";
import { createEdgeVertexSetup } from "./test-helpers.mjs";
import { readFileSync } from "fs";
import { resolve } from "path";
import C from "../assets/lib/orientation-restriction/C.mjs";

describe("isDeviating()", function () {
  let s;
  beforeEach(function () {
    s = createEdgeVertexSetup();
  });

  it("returns true for an deviating edge", function () {
    s.od53.assignedAngle = 2;
    s.dcel.config = { C: new C(2) };
    expect(s.od53.isDeviating()).toBe(true);
  });

  it("returns true for an deviating edge", function () {
    s.od53.assignedAngle = 3;
    s.dcel.config = { C: new C(2) };
    expect(s.od53.isDeviating()).toBe(true);
    s.dcel.config = { C: new C(4) };
    expect(s.od53.isDeviating()).toBe(true);
  });

  it("returns false for a basic edge", function () {
    s.od53.assignedAngle = 1;
    s.dcel.config = { C: new C(2) };
    expect(s.od53.isDeviating()).toBe(false);
    s.dcel.config = { C: new C(4) };
    expect(s.od53.isDeviating()).toBe(false);
  });

  it("returns false for a basic edge", function () {
    s.od333.assignedAngle = 0;
    s.dcel.config = { C: new C(2) };
    expect(s.od333.isDeviating()).toBe(false);
    s.dcel.config = { C: new C(4) };
    expect(s.od333.isDeviating()).toBe(false);
  });

  it("returns false for a basic edge", function () {
    s.od53.assignedAngle = 0;
    s.dcel.config = { C: new C(2) };
    expect(s.od53.isDeviating()).toBe(false);
  });

  it("returns false for a for a basic aligned edge", function () {
    s.od90.assignedAngle = 1;
    s.dcel.config = { C: new C(2) };
    expect(s.od90.isDeviating()).toBe(false);
  });

  it("returns true for a for a deviating aligned edge", function () {
    s.od90.assignedAngle = 2;
    s.dcel.config = { C: new C(2) };
    expect(s.od90.isDeviating()).toBe(true);
  });

  it("returns false for a for a basic aligned edge", function () {
    s.od90.assignedAngle = 2;
    s.dcel.config = { C: new C(4) };
    expect(s.od90.isDeviating()).toBe(false);
  });

  it("returns false for a for a basic aligned edge", function () {
    s.od315.assignedAngle = 7;
    s.dcel.config = { C: new C(4) };
    expect(s.od315.isDeviating()).toBe(false);
  });
});

describe("getSignificantEndpoint()", function () {
  let s;
  beforeEach(function () {
    s = createEdgeVertexSetup();
  });

  it("returns an significant endpoint if one is specified", function () {
    expect(s.od53.getSignificantEndpoint()).toEqual(s.o);
  });
  it("returns randomly one of its endpoints if neither of them are significant", function () {
    s.o.significance = false;
    expect(s.od53.getSignificantEndpoint()).toBeInstanceOf(Vertex);
  });
});

describe("Given the examples in the paper of buchin et al., directions are assigned, correctly on example", function () {
  let s;
  beforeEach(function () {
    s = createEdgeVertexSetup();
  });

  it("a", function () {
    s.o.edges.push(s.od53, s.od217);
    s.dcel.config = { C: new C(2) };
    expect(s.o.assignAngles().map((edge) => edge.assignedAngle)).toEqual([1, 2]);
  });

  it("b", function () {
    s.o.edges.push(s.od53, s.od180, s.od270);
    s.dcel.config = { C: new C(2) };
    expect(s.o.assignAngles().map((edge) => edge.assignedAngle)).toEqual([1, 2, 3]);
  });

  it("c", function () {
    s.o.edges.push(s.od37, s.od90, s.od143);
    s.dcel.config = { C: new C(2) };
    expect(s.o.assignAngles().map((edge) => edge.assignedAngle)).toEqual([0, 1, 2]);
  });

  it("d", function () {
    s.o.edges.push(s.od37, s.od76);
    s.dcel.config = { C: new C(2) };
    expect(s.o.assignAngles().map((edge) => edge.assignedAngle)).toEqual([0, 1]);
  });

  it("e", function () {
    s.o.edges.push(s.od37, s.od53, s.od76);
    s.dcel.config = { C: new C(2) };
    expect(s.o.assignAngles().map((edge) => edge.assignedAngle)).toEqual([0, 1, 2]);
  });

  it("f", function () {
    s.o.edges.push(s.od0, s.od37, s.od53, s.od76);
    s.dcel.config = { C: new C(2) };
    expect(s.o.assignAngles().map((edge) => edge.assignedAngle)).toEqual([3, 0, 1, 2]);
  });

  it("g", function () {
    s.o.edges.push(s.od315, s.od333, s.od53, s.od76);
    s.dcel.config = { C: new C(2) };
    expect(s.o.assignAngles().map((edge) => edge.assignedAngle)).toEqual([1, 2, 3, 0]);
  });

  it("h", function () {
    s.o.edges.push(s.od53, s.od217);
    s.dcel.config = { C: new C(4) };
    expect(s.o.assignAngles().map((edge) => edge.assignedAngle)).toEqual([1, 5]);
  });

  it("i", function () {
    s.o.edges.push(s.od53, s.od180, s.od270);
    s.dcel.config = { C: new C(4) };
    expect(s.o.assignAngles().map((edge) => edge.assignedAngle)).toEqual([1, 4, 6]);
  });

  it("j", function () {
    s.o.edges.push(s.od37, s.od90, s.od143);
    s.dcel.config = { C: new C(4) };
    expect(s.o.assignAngles().map((edge) => edge.assignedAngle)).toEqual([1, 2, 3]);
  });

  it("k", function () {
    s.o.edges.push(s.od37, s.od76);
    s.dcel.config = { C: new C(4) };
    expect(s.o.assignAngles().map((edge) => edge.assignedAngle)).toEqual([1, 2]);
  });

  it("l", function () {
    s.o.edges.push(s.od37, s.od53, s.od76);
    s.dcel.config = { C: new C(4) };
    expect(s.o.assignAngles().map((edge) => edge.assignedAngle)).toEqual([0, 1, 2]);
  });

  it("m", function () {
    s.o.edges.push(s.od0, s.od14, s.od53, s.od76);
    s.dcel.config = { C: new C(4) };
    expect(s.o.assignAngles().map((edge) => edge.assignedAngle)).toEqual([7, 0, 1, 2]);
  });

  it("n", function () {
    s.o.edges.push(s.od315, s.od333, s.od53, s.od76);
    s.dcel.config = { C: new C(4) };
    expect(s.o.assignAngles().map((edge) => edge.assignedAngle)).toEqual([1, 2, 7, 0]);
  });
});

describe("Given the examples in the paper of buchin et al., classify() works as expected on example", function () {
  let s;
  beforeEach(function () {
    s = createEdgeVertexSetup();
  });

  it("a", function () {
    s.o.edges.push(s.od53, s.od217);
    s.dcel.config = { C: new C(2) };
    expect(s.od53.classify()).toBe("unalignedBasic");
    expect(s.od217.classify()).toBe("unalignedBasic");
  });

  it("b", function () {
    s.o.edges.push(s.od53, s.od180, s.od270);
    s.dcel.config = { C: new C(2) };
    expect(s.od53.classify()).toBe("unalignedBasic");
    expect(s.od180.classify()).toBe("alignedBasic");
    expect(s.od270.classify()).toBe("alignedBasic");
  });

  it("c", function () {
    s.o.edges.push(s.od37, s.od90, s.od104);
    s.dcel.config = { C: new C(2) };
    expect(s.od37.classify()).toBe("unalignedBasic");
    expect(s.od90.classify()).toBe("alignedBasic");
    expect(s.od104.classify()).toBe("unalignedBasic");
  });

  it("d", function () {
    s.o.edges.push(s.od37, s.od53);
    s.dcel.config = { C: new C(2) };
    expect(s.od37.classify()).toBe("evading");
    expect(s.od53.classify()).toBe("evading");
  });

  it("e", function () {
    s.o.edges.push(s.od37, s.od53, s.od76);
    s.dcel.config = { C: new C(2) };
    expect(s.od37.classify()).toBe("evading");
    expect(s.od53.classify()).toBe("evading");
    expect(s.od76.classify()).toBe("unalignedDeviating");
  });

  it("f", function () {
    s.o.edges.push(s.od0, s.od37, s.od53, s.od76);
    s.dcel.config = { C: new C(2) };
    expect(s.od0.classify()).toBe("alignedDeviating");
    expect(s.od37.classify()).toBe("evading");
    expect(s.od53.classify()).toBe("evading");
    expect(s.od76.classify()).toBe("unalignedDeviating");
  });

  it("g", function () {
    s.o.edges.push(s.od315, s.od333, s.od53, s.od76);
    s.dcel.config = { C: new C(2) };
    expect(s.od315.classify()).toBe("evading");
    expect(s.od333.classify()).toBe("evading");
    expect(s.od53.classify()).toBe("unalignedBasic");
    expect(s.od76.classify()).toBe("unalignedDeviating");
  });

  it("h", function () {
    s.o.edges.push(s.od53, s.od217);
    s.dcel.config = { C: new C(4) };
    expect(s.od53.classify()).toBe("unalignedBasic");
    expect(s.od217.classify()).toBe("unalignedBasic");
  });

  it("i", function () {
    s.o.edges.push(s.od53, s.od180, s.od270);
    s.dcel.config = { C: new C(4) };
    expect(s.od53.classify()).toBe("unalignedBasic");
    expect(s.od180.classify()).toBe("alignedBasic");
    expect(s.od270.classify()).toBe("alignedBasic");
  });

  it("j", function () {
    s.o.edges.push(s.od53, s.od90, s.od104);
    s.dcel.config = { C: new C(4) };
    expect(s.od53.classify()).toBe("unalignedBasic");
    expect(s.od90.classify()).toBe("alignedBasic");
    expect(s.od104.classify()).toBe("unalignedBasic");
  });

  it("k", function () {
    s.o.edges.push(s.od37, s.od53);
    s.dcel.config = { C: new C(4) };
    expect(s.od37.classify()).toBe("unalignedBasic");
    expect(s.od53.classify()).toBe("unalignedBasic");
  });

  it("l", function () {
    s.o.edges.push(s.od37, s.od53, s.od76);
    s.dcel.config = { C: new C(4) };
    expect(s.od37.classify()).toBe("unalignedBasic");
    expect(s.od53.classify()).toBe("evading");
    expect(s.od76.classify()).toBe("evading");
  });

  it("m", function () {
    s.o.edges.push(s.od0, s.od14, s.od53, s.od76);
    s.dcel.config = { C: new C(4) };
    expect(s.od0.classify()).toBe("alignedDeviating");
    expect(s.od14.classify()).toBe("unalignedBasic");
    expect(s.od53.classify()).toBe("evading");
    expect(s.od76.classify()).toBe("evading");
  });

  it("n", function () {
    s.o.edges.push(s.od315, s.od333, s.od53, s.od76);
    s.dcel.config = { C: new C(4) };
    expect(s.od315.classify(s.c4)).toBe("alignedBasic");
    expect(s.od333.classify(s.c4)).toBe("unalignedBasic");
    expect(s.od53.classify(s.c4)).toBe("evading");
    expect(s.od76.classify(s.c4)).toBe("evading");
  });
});

describe("classifyEdges() in a classification where all edges are classified and a halfedge and its twin share the same class", function () {
  it("on simple test data", function () {
    const json = JSON.parse(readFileSync(resolve("assets/data/shapes/edge-cases.json"), "utf8"));
    const dcel = DCEL.fromGeoJSON(json);
    dcel.preProcess();
    dcel.classify();
    const edgesWithoutClassification = dcel.halfEdges.filter((edge) => edge.class === undefined);
    const edgesWithDivergingClasses = dcel.halfEdges.filter(
      (edge) => edge.class !== edge.twin.class
    );

    expect(edgesWithDivergingClasses.length).toBe(0);
    expect(edgesWithoutClassification.length).toBe(0);
  });

  it("on geo data", function () {
    const json = JSON.parse(
      readFileSync(resolve("assets/data/geodata/ne_110m_admin_0_countries.json"), "utf8")
    );
    const dcel = DCEL.fromGeoJSON(json);
    dcel.preProcess();
    dcel.classify();
    const edgesWithoutClassification = dcel.halfEdges.filter((edge) => edge.class === undefined);
    const edgesWithDivergingClasses = dcel.halfEdges.filter(
      (edge) => edge.class !== edge.twin.class
    );

    expect(edgesWithDivergingClasses.length).toBe(0);
    expect(edgesWithoutClassification.length).toBe(0);
  });
});
