import Vertex from "../assets/lib/dcel/Vertex.mjs";
import DCEL from "../assets/lib/dcel/Dcel.mjs";
import { createEdgeVertexSetup } from "./test-helpers.mjs";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("isDeviating()", function () {
  let s;
  beforeEach(function () {
    s = createEdgeVertexSetup();
  });

  it("returns true for an deviating edge", function () {
    s.od53.schematizationProperties.direction = 2;
    expect(s.od53.isDeviating(s.c2.getSectors())).toBe(true);
  });

  it("returns true for an deviating edge", function () {
    s.od53.schematizationProperties.direction = 3;
    expect(s.od53.isDeviating(s.c2.getSectors())).toBe(true);
    expect(s.od53.isDeviating(s.c4.getSectors())).toBe(true);
  });

  it("returns false for a basic edge", function () {
    s.od53.schematizationProperties.direction = 1;
    expect(s.od53.isDeviating(s.c2.getSectors())).toBe(false);
    expect(s.od53.isDeviating(s.c4.getSectors())).toBe(false);
  });

  it("returns false for a basic edge", function () {
    s.od333.schematizationProperties.direction = 0;
    expect(s.od333.isDeviating(s.c2.getSectors())).toBe(false);
    expect(s.od333.isDeviating(s.c4.getSectors())).toBe(false);
  });

  it("returns false for a basic edge", function () {
    s.od53.schematizationProperties.direction = 0;
    expect(s.od53.isDeviating(s.c2.getSectors())).toBe(false);
  });

  it("returns false for a for a basic aligned edge", function () {
    s.od90.schematizationProperties.direction = 1;
    expect(s.od90.isDeviating(s.c2.getSectors())).toBe(false);
  });

  it("returns true for a for a deviating aligned edge", function () {
    s.od90.schematizationProperties.direction = 2;
    expect(s.od90.isDeviating(s.c2.getSectors())).toBe(true);
  });

  it("returns false for a for a basic aligned edge", function () {
    s.od90.schematizationProperties.direction = 2;
    expect(s.od90.isDeviating(s.c4.getSectors())).toBe(false);
  });

  it("returns false for a for a basic aligned edge", function () {
    s.od315.schematizationProperties.direction = 7;
    expect(s.od315.isDeviating(s.c4.getSectors())).toBe(false);
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
    s.o.schematizationProperties.isSignificant = false;
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
    expect(
      s.o.assignDirections(s.c2).map((edge) => edge.schematizationProperties.direction)
    ).toEqual([1, 2]);
  });

  it("b", function () {
    s.o.edges.push(s.od53, s.od180, s.od270);
    expect(
      s.o.assignDirections(s.c2).map((edge) => edge.schematizationProperties.direction)
    ).toEqual([1, 2, 3]);
  });

  it("c", function () {
    s.o.edges.push(s.od37, s.od90, s.od143);
    expect(
      s.o.assignDirections(s.c2).map((edge) => edge.schematizationProperties.direction)
    ).toEqual([0, 1, 2]);
  });

  it("d", function () {
    s.o.edges.push(s.od37, s.od76);
    expect(
      s.o.assignDirections(s.c2).map((edge) => edge.schematizationProperties.direction)
    ).toEqual([0, 1]);
  });

  it("e", function () {
    s.o.edges.push(s.od37, s.od53, s.od76);
    expect(
      s.o.assignDirections(s.c2).map((edge) => edge.schematizationProperties.direction)
    ).toEqual([0, 1, 2]);
  });

  it("f", function () {
    s.o.edges.push(s.od0, s.od37, s.od53, s.od76);
    expect(
      s.o.assignDirections(s.c2).map((edge) => edge.schematizationProperties.direction)
    ).toEqual([3, 0, 1, 2]);
  });

  it("g", function () {
    s.o.edges.push(s.od315, s.od333, s.od53, s.od76);
    expect(
      s.o.assignDirections(s.c2).map((edge) => edge.schematizationProperties.direction)
    ).toEqual([1, 2, 3, 0]);
  });

  it("h", function () {
    s.o.edges.push(s.od53, s.od217);
    expect(
      s.o.assignDirections(s.c4).map((edge) => edge.schematizationProperties.direction)
    ).toEqual([1, 5]);
  });

  it("i", function () {
    s.o.edges.push(s.od53, s.od180, s.od270);
    expect(
      s.o.assignDirections(s.c4).map((edge) => edge.schematizationProperties.direction)
    ).toEqual([1, 4, 6]);
  });

  it("j", function () {
    s.o.edges.push(s.od37, s.od90, s.od143);
    expect(
      s.o.assignDirections(s.c4).map((edge) => edge.schematizationProperties.direction)
    ).toEqual([1, 2, 3]);
  });

  it("k", function () {
    s.o.edges.push(s.od37, s.od76);
    expect(
      s.o.assignDirections(s.c4).map((edge) => edge.schematizationProperties.direction)
    ).toEqual([1, 2]);
  });

  it("l", function () {
    s.o.edges.push(s.od37, s.od53, s.od76);
    expect(
      s.o.assignDirections(s.c4).map((edge) => edge.schematizationProperties.direction)
    ).toEqual([0, 1, 2]);
  });

  it("m", function () {
    s.o.edges.push(s.od0, s.od14, s.od53, s.od76);
    expect(
      s.o.assignDirections(s.c4).map((edge) => edge.schematizationProperties.direction)
    ).toEqual([7, 0, 1, 2]);
  });

  it("n", function () {
    s.o.edges.push(s.od315, s.od333, s.od53, s.od76);
    expect(
      s.o.assignDirections(s.c4).map((edge) => edge.schematizationProperties.direction)
    ).toEqual([1, 2, 7, 0]);
  });
});

describe("Given the examples in the paper of buchin et al., classify() works as expected on example", function () {
  let s;
  beforeEach(function () {
    s = createEdgeVertexSetup();
  });

  it("a", function () {
    s.o.edges.push(s.od53, s.od217);
    expect(s.od53.classify(s.c2)).toBe("unalignedBasic");
    expect(s.od217.classify(s.c2)).toBe("unalignedBasic");
  });

  it("b", function () {
    s.o.edges.push(s.od53, s.od180, s.od270);
    expect(s.od53.classify(s.c2)).toBe("unalignedBasic");
    expect(s.od180.classify(s.c2)).toBe("alignedBasic");
    expect(s.od270.classify(s.c2)).toBe("alignedBasic");
  });

  it("c", function () {
    s.o.edges.push(s.od37, s.od90, s.od104);
    expect(s.od37.classify(s.c2)).toBe("unalignedBasic");
    expect(s.od90.classify(s.c2)).toBe("alignedBasic");
    expect(s.od104.classify(s.c2)).toBe("unalignedBasic");
  });

  it("d", function () {
    s.o.edges.push(s.od37, s.od53);
    expect(s.od37.classify(s.c2)).toBe("evading");
    expect(s.od53.classify(s.c2)).toBe("evading");
  });

  it("e", function () {
    s.o.edges.push(s.od37, s.od53, s.od76);
    expect(s.od37.classify(s.c2)).toBe("evading");
    expect(s.od53.classify(s.c2)).toBe("evading");
    expect(s.od76.classify(s.c2)).toBe("unalignedDeviating");
  });

  it("f", function () {
    s.o.edges.push(s.od0, s.od37, s.od53, s.od76);
    expect(s.od0.classify(s.c2)).toBe("alignedDeviating");
    expect(s.od37.classify(s.c2)).toBe("evading");
    expect(s.od53.classify(s.c2)).toBe("evading");
    expect(s.od76.classify(s.c2)).toBe("unalignedDeviating");
  });

  it("g", function () {
    s.o.edges.push(s.od315, s.od333, s.od53, s.od76);
    expect(s.od315.classify(s.c2)).toBe("evading");
    expect(s.od333.classify(s.c2)).toBe("evading");
    expect(s.od53.classify(s.c2)).toBe("unalignedBasic");
    expect(s.od76.classify(s.c2)).toBe("unalignedDeviating");
  });

  it("h", function () {
    s.o.edges.push(s.od53, s.od217);
    expect(s.od53.classify(s.c4)).toBe("unalignedBasic");
    expect(s.od217.classify(s.c4)).toBe("unalignedBasic");
  });

  it("i", function () {
    s.o.edges.push(s.od53, s.od180, s.od270);
    expect(s.od53.classify(s.c4)).toBe("unalignedBasic");
    expect(s.od180.classify(s.c4)).toBe("alignedBasic");
    expect(s.od270.classify(s.c4)).toBe("alignedBasic");
  });

  it("j", function () {
    s.o.edges.push(s.od53, s.od90, s.od104);
    expect(s.od53.classify(s.c4)).toBe("unalignedBasic");
    expect(s.od90.classify(s.c4)).toBe("alignedBasic");
    expect(s.od104.classify(s.c4)).toBe("unalignedBasic");
  });

  it("k", function () {
    s.o.edges.push(s.od37, s.od53);
    expect(s.od37.classify(s.c4)).toBe("unalignedBasic");
    expect(s.od53.classify(s.c4)).toBe("unalignedBasic");
  });

  it("l", function () {
    s.o.edges.push(s.od37, s.od53, s.od76);
    expect(s.od37.classify(s.c4)).toBe("unalignedBasic");
    expect(s.od53.classify(s.c4)).toBe("evading");
    expect(s.od76.classify(s.c4)).toBe("evading");
  });

  it("m", function () {
    s.o.edges.push(s.od0, s.od14, s.od53, s.od76);
    expect(s.od0.classify(s.c4)).toBe("alignedDeviating");
    expect(s.od14.classify(s.c4)).toBe("unalignedBasic");
    expect(s.od53.classify(s.c4)).toBe("evading");
    expect(s.od76.classify(s.c4)).toBe("evading");
  });

  it("n", function () {
    s.o.edges.push(s.od315, s.od333, s.od53, s.od76);
    expect(s.od315.classify(s.c4)).toBe("alignedBasic");
    expect(s.od333.classify(s.c4)).toBe("unalignedBasic");
    expect(s.od53.classify(s.c4)).toBe("evading");
    expect(s.od76.classify(s.c4)).toBe("evading");
  });
});

describe("classifyEdges() in a classification where all edges are classified and a halfedge and its twin share the same class", function () {
  it("on simple test data", function () {
    const json = JSON.parse(readFileSync(resolve("assets/data/shapes/edge-cases.json"), "utf8"));
    const dcel = DCEL.buildFromGeoJSON(json);
    const edgesWithoutClassification = dcel.halfEdges.filter(
      (edge) => typeof edge.schematizationProperties.classification === undefined
    );
    const edgesWithDivergingClasses = dcel.halfEdges.filter(
      (edge) =>
        edge.schematizationProperties.classification !==
        edge.twin.schematizationProperties.classification
    );

    expect(edgesWithDivergingClasses.length).toBe(0);
    expect(edgesWithoutClassification.length).toBe(0);
  });

  it("on geo data", function () {
    const json = JSON.parse(
      readFileSync(resolve("assets/data/geodata/ne_110m_admin_0_countries.json"), "utf8")
    );
    const dcel = DCEL.buildFromGeoJSON(json);
    const edgesWithoutClassification = dcel.halfEdges.filter(
      (edge) => typeof edge.schematizationProperties.classification === undefined
    );
    const edgesWithDivergingClasses = dcel.halfEdges.filter(
      (edge) =>
        edge.schematizationProperties.classification !==
        edge.twin.schematizationProperties.classification
    );

    expect(edgesWithDivergingClasses.length).toBe(0);
    expect(edgesWithoutClassification.length).toBe(0);
  });
});
