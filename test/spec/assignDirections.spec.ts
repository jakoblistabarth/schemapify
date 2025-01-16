import CRegular from "@/src/c-oriented-schematization/CRegular";
import {
  createEdgeVertexSetup,
  getClassification,
  TestSetup,
} from "./test-setup";

describe("Given the examples in the paper of Buchin et al., directions are assigned, correctly on example", function () {
  let s: TestSetup;

  beforeEach(() => {
    s = createEdgeVertexSetup();
  });

  it("a", () => {
    // this example needs a significant vertex even though it is not like this in the paper
    // however, whithout the significant vertex, the direction is not unambigous
    const assignedDirections = getClassification(
      s,
      [s.directions.od53, s.directions.od217],
      "assignedDirection",
      {
        significantVertices: [s.origin.uuid],
      },
    );
    expect(assignedDirections).toEqual([1, 2]);
  });

  it("b", () => {
    // this example needs a significant vertex even though it is not like this in the paper
    // how
    const assignedDirections = getClassification(
      s,
      [s.directions.od53, s.directions.od180, s.directions.od270],
      "assignedDirection",
      { significantVertices: [s.origin.uuid] },
    );
    expect(assignedDirections).toEqual([1, 2, 3]);
  });

  // TODO: fix test / assignment of directions
  it("c", function () {
    const assignedDirections = getClassification(
      s,
      [s.directions.od37, s.directions.od90, s.directions.od143],
      "assignedDirection",
      { significantVertices: [s.origin.uuid] },
    );
    expect(assignedDirections).toEqual([0, 1, 2]);
  });

  it("d", function () {
    const assignedDirections = getClassification(
      s,
      [s.directions.od37, s.directions.od76],
      "assignedDirection",
      {
        significantVertices: [s.origin.uuid],
      },
    );
    expect(assignedDirections).toEqual([0, 1]);
  });

  it("e", function () {
    const assignedDirections = getClassification(
      s,
      [s.directions.od37, s.directions.od53, s.directions.od76],
      "assignedDirection",
      { significantVertices: [s.origin.uuid] },
    );
    expect(assignedDirections).toEqual([0, 1, 2]);
  });

  it("f", function () {
    const assignedDirections = getClassification(
      s,
      [
        s.directions.od0,
        s.directions.od37,
        s.directions.od53,
        s.directions.od76,
      ],
      "assignedDirection",
      { significantVertices: [s.origin.uuid] },
    );
    expect(assignedDirections).toEqual([3, 0, 1, 2]);
  });

  it("g", function () {
    const assignedDirections = getClassification(
      s,
      [
        s.directions.od315,
        s.directions.od333,
        s.directions.od53,
        s.directions.od76,
      ],
      "assignedDirection",
      { significantVertices: [s.origin.uuid] },
    );
    expect(assignedDirections).toEqual([1, 2, 3, 0]);
  });

  it("h", function () {
    // this example needs a significant vertex even though it is not like this in the paper
    // however, whithout the significant vertex, the direction is not unambigous
    const assignedDirections = getClassification(
      s,
      [s.directions.od53, s.directions.od217],
      "assignedDirection",
      {
        c: new CRegular(4),
        significantVertices: [s.origin.uuid],
      },
    );

    expect(assignedDirections).toEqual([1, 5]);
  });

  it("i", function () {
    // this example needs a significant vertex even though it is not like this in the paper
    // however, whithout the significant vertex, the direction is not unambigous
    const assignedDirections = getClassification(
      s,
      [s.directions.od53, s.directions.od180, s.directions.od270],
      "assignedDirection",
      { c: new CRegular(4), significantVertices: [s.origin.uuid] },
    );

    expect(assignedDirections).toEqual([1, 4, 6]);
  });

  it("j", function () {
    const assignedDirections = getClassification(
      s,
      [s.directions.od37, s.directions.od90, s.directions.od143],
      "assignedDirection",
      { significantVertices: [s.origin.uuid], c: new CRegular(4) },
    );

    expect(assignedDirections).toEqual([1, 2, 3]);
  });

  it("k", function () {
    const assignedDirections = getClassification(
      s,
      [s.directions.od37, s.directions.od76],
      "assignedDirection",
      {
        significantVertices: [s.origin.uuid],
        c: new CRegular(4),
      },
    );

    expect(assignedDirections).toEqual([1, 2]);
  });

  it("l", function () {
    const assignedDirections = getClassification(
      s,
      [s.directions.od37, s.directions.od53, s.directions.od76],
      "assignedDirection",
      { significantVertices: [s.origin.uuid], c: new CRegular(4) },
    );

    expect(assignedDirections).toEqual([0, 1, 2]);
  });

  it("m", function () {
    const assignedDirections = getClassification(
      s,
      [
        s.directions.od0,
        s.directions.od14,
        s.directions.od53,
        s.directions.od76,
      ],
      "assignedDirection",
      { significantVertices: [s.origin.uuid], c: new CRegular(4) },
    );

    expect(assignedDirections).toEqual([7, 0, 1, 2]);
  });

  it("n", function () {
    const assignedDirections = getClassification(
      s,
      [
        s.directions.od315,
        s.directions.od333,
        s.directions.od53,
        s.directions.od76,
      ],
      "assignedDirection",
      { significantVertices: [s.origin.uuid], c: new CRegular(4) },
    );

    expect(assignedDirections).toEqual([1, 2, 7, 0]);
  });
});

describe("assignDirections(config.c) on own examples", function () {
  let s: TestSetup;

  beforeEach(function () {
    s = createEdgeVertexSetup();
  });

  it("with 4 edges (A) in C(2)", function () {
    const assignedDirections = getClassification(
      s,
      [
        s.directions.od90,
        s.directions.od143,
        s.directions.od180,
        s.directions.od217,
      ],
      "assignedDirection",
      { significantVertices: [s.origin.uuid] },
    );
    expect(assignedDirections).toEqual([0, 1, 2, 3]);
  });

  it("with 4 edges (B) in C(2)", function () {
    const assignedDirections = getClassification(
      s,
      [
        s.directions.od90,
        s.directions.od104,
        s.directions.od180,
        s.directions.od217,
      ],
      "assignedDirection",
      { significantVertices: [s.origin.uuid] },
    );
    expect(assignedDirections).toEqual([0, 1, 2, 3]);
  });

  it("with 4 edges (C) in C(2)", function () {
    const assignedDirections = getClassification(
      s,
      [
        s.directions.od90,
        s.directions.od153,
        s.directions.od180,
        s.directions.od243,
      ],
      "assignedDirection",
      { significantVertices: [s.origin.uuid] },
    );
    expect(assignedDirections).toEqual([0, 1, 2, 3]);
  });

  it("with 4 edges (D) in C(2)", function () {
    const assignedDirections = getClassification(
      s,
      [
        s.directions.od153,
        s.directions.od166,
        s.directions.od180,
        s.directions.od243,
      ],
      "assignedDirection",
      { significantVertices: [s.origin.uuid] },
    );
    expect(assignedDirections).toEqual([0, 1, 2, 3]);
  });

  it("with 4 edges (E) in C(3)", function () {
    const assignedDirections = getClassification(
      s,
      [
        s.directions.od153,
        s.directions.od166,
        s.directions.od180,
        s.directions.od243,
      ],
      "assignedDirection",
      { c: new CRegular(3), significantVertices: [s.origin.uuid] },
    );
    expect(assignedDirections).toEqual([1, 2, 3, 4]);
  });

  it("with 4 edges (F) in C(2)", function () {
    const assignedDirections = getClassification(
      s,
      [s.directions.od0, s.directions.od14, s.directions.od333],
      "assignedDirection",
      { significantVertices: [s.origin.uuid] },
    );
    expect(assignedDirections).toEqual([0, 1, 3]);
  });

  it("with 4 edges (G) in C(2)", function () {
    const assignedDirections = getClassification(
      s,
      [
        s.directions.od14,
        s.directions.od104,
        s.directions.od243,
        s.directions.od333,
      ],
      "assignedDirection",
      { significantVertices: [s.origin.uuid] },
    );
    expect(assignedDirections).toEqual([0, 1, 2, 3]);
  });

  it("with 3 edges (H) in C(2)", function () {
    const assignedDirections = getClassification(
      s,
      [s.directions.od14, s.directions.od243, s.directions.od284],
      "assignedDirection",
      { significantVertices: [s.origin.uuid] },
    );
    expect(assignedDirections).toEqual([0, 2, 3]);
  });
});
