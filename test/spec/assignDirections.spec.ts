import CRegular from "@/src/c-oriented-schematization/CRegular";
import { createEdgeVertexSetup, getDirections, TestSetup } from "./test-setup";

describe("Given the examples in the paper of Buchin et al., directions are assigned, correctly on example", function () {
  let s: TestSetup;

  beforeEach(() => {
    s = createEdgeVertexSetup();
  });

  it("a", () => {
    // this example needs a significant vertex even though it is not like this in the paper
    // however, whithout the significant vertex, the direction is not unambigous
    const solution = getDirections(s, [s.directions.od53, s.directions.od217], {
      significantVertices: [s.origin.uuid],
    });
    expect(solution).toEqual([1, 2]);
  });

  it("b", () => {
    // this example needs a significant vertex even though it is not like this in the paper
    // how
    const solution = getDirections(
      s,
      [s.directions.od53, s.directions.od180, s.directions.od270],
      { significantVertices: [s.origin.uuid] },
    );
    expect(solution).toEqual([1, 2, 3]);
  });

  // TODO: fix test / assignment of directions
  it("c", function () {
    const solution = getDirections(
      s,
      [s.directions.od37, s.directions.od90, s.directions.od143],
      { significantVertices: [s.origin.uuid] },
    );
    expect(solution).toEqual([0, 1, 2]);
  });

  it("d", function () {
    const solution = getDirections(s, [s.directions.od37, s.directions.od76], {
      significantVertices: [s.origin.uuid],
    });
    expect(solution).toEqual([0, 1]);
  });

  it("e", function () {
    const solution = getDirections(
      s,
      [s.directions.od37, s.directions.od53, s.directions.od76],
      { significantVertices: [s.origin.uuid] },
    );
    expect(solution).toEqual([0, 1, 2]);
  });

  it("f", function () {
    const solution = getDirections(
      s,
      [
        s.directions.od0,
        s.directions.od37,
        s.directions.od53,
        s.directions.od76,
      ],
      { significantVertices: [s.origin.uuid] },
    );
    expect(solution).toEqual([3, 0, 1, 2]);
  });

  it("g", function () {
    const solution = getDirections(
      s,
      [
        s.directions.od315,
        s.directions.od333,
        s.directions.od53,
        s.directions.od76,
      ],
      { significantVertices: [s.origin.uuid] },
    );
    expect(solution).toEqual([1, 2, 3, 0]);
  });

  it("h", function () {
    // this example needs a significant vertex even though it is not like this in the paper
    // however, whithout the significant vertex, the direction is not unambigous
    const solution = getDirections(s, [s.directions.od53, s.directions.od217], {
      c: new CRegular(4),
      significantVertices: [s.origin.uuid],
    });

    expect(solution).toEqual([1, 5]);
  });

  it("i", function () {
    // this example needs a significant vertex even though it is not like this in the paper
    // however, whithout the significant vertex, the direction is not unambigous
    const solution = getDirections(
      s,
      [s.directions.od53, s.directions.od180, s.directions.od270],
      { c: new CRegular(4), significantVertices: [s.origin.uuid] },
    );

    expect(solution).toEqual([1, 4, 6]);
  });

  it("j", function () {
    const solution = getDirections(
      s,
      [s.directions.od37, s.directions.od90, s.directions.od143],
      { significantVertices: [s.origin.uuid], c: new CRegular(4) },
    );

    expect(solution).toEqual([1, 2, 3]);
  });

  it("k", function () {
    const solution = getDirections(s, [s.directions.od37, s.directions.od76], {
      significantVertices: [s.origin.uuid],
      c: new CRegular(4),
    });

    expect(solution).toEqual([1, 2]);
  });

  it("l", function () {
    const solution = getDirections(
      s,
      [s.directions.od37, s.directions.od53, s.directions.od76],
      { significantVertices: [s.origin.uuid], c: new CRegular(4) },
    );

    expect(solution).toEqual([0, 1, 2]);
  });

  it("m", function () {
    const solution = getDirections(
      s,
      [
        s.directions.od0,
        s.directions.od14,
        s.directions.od53,
        s.directions.od76,
      ],
      { significantVertices: [s.origin.uuid], c: new CRegular(4) },
    );

    expect(solution).toEqual([7, 0, 1, 2]);
  });

  it("n", function () {
    const solution = getDirections(
      s,
      [
        s.directions.od315,
        s.directions.od333,
        s.directions.od53,
        s.directions.od76,
      ],
      { significantVertices: [s.origin.uuid], c: new CRegular(4) },
    );

    expect(solution).toEqual([1, 2, 7, 0]);
  });
});

describe("assignDirections(config.c) on own examples", function () {
  let s: TestSetup;

  beforeEach(function () {
    s = createEdgeVertexSetup();
  });

  it("with 4 edges (A) in C(2)", function () {
    const solution = getDirections(
      s,
      [
        s.directions.od90,
        s.directions.od143,
        s.directions.od180,
        s.directions.od217,
      ],
      { significantVertices: [s.origin.uuid] },
    );
    expect(solution).toEqual([0, 1, 2, 3]);
  });

  it("with 4 edges (B) in C(2)", function () {
    const solution = getDirections(
      s,
      [
        s.directions.od90,
        s.directions.od104,
        s.directions.od180,
        s.directions.od217,
      ],
      { significantVertices: [s.origin.uuid] },
    );
    expect(solution).toEqual([0, 1, 2, 3]);
  });

  it("with 4 edges (C) in C(2)", function () {
    const solution = getDirections(
      s,
      [
        s.directions.od90,
        s.directions.od153,
        s.directions.od180,
        s.directions.od243,
      ],
      { significantVertices: [s.origin.uuid] },
    );
    expect(solution).toEqual([0, 1, 2, 3]);
  });

  it("with 4 edges (D) in C(2)", function () {
    const solution = getDirections(
      s,
      [
        s.directions.od153,
        s.directions.od166,
        s.directions.od180,
        s.directions.od243,
      ],
      { significantVertices: [s.origin.uuid] },
    );
    expect(solution).toEqual([0, 1, 2, 3]);
  });

  it("with 4 edges (E) in C(3)", function () {
    const solution = getDirections(
      s,
      [
        s.directions.od153,
        s.directions.od166,
        s.directions.od180,
        s.directions.od243,
      ],
      { c: new CRegular(3), significantVertices: [s.origin.uuid] },
    );
    expect(solution).toEqual([1, 2, 3, 4]);
  });

  it("with 4 edges (F) in C(2)", function () {
    const solution = getDirections(
      s,
      [s.directions.od0, s.directions.od14, s.directions.od333],
      { significantVertices: [s.origin.uuid] },
    );
    expect(solution).toEqual([0, 1, 3]);
  });

  it("with 4 edges (G) in C(2)", function () {
    const solution = getDirections(
      s,
      [
        s.directions.od14,
        s.directions.od104,
        s.directions.od243,
        s.directions.od333,
      ],
      { significantVertices: [s.origin.uuid] },
    );
    expect(solution).toEqual([0, 1, 2, 3]);
  });

  it("with 3 edges (H) in C(2)", function () {
    const solution = getDirections(
      s,
      [s.directions.od14, s.directions.od243, s.directions.od284],
      { significantVertices: [s.origin.uuid] },
    );
    expect(solution).toEqual([0, 2, 3]);
  });
});
