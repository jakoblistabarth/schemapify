import { createEdgeVertexSetup, TestSetup } from "./test-setup";
import { style } from "@/src/c-oriented-schematization/schematization.style";
import CRegular from "@/src/c-oriented-schematization/CRegular";
import C from "@/src/c-oriented-schematization/C";

describe("Given the examples in the paper of Buchin et al., directions are assigned, correctly on example", function () {
  let s: TestSetup;
  let c: C;

  beforeEach(function () {
    s = createEdgeVertexSetup();
    ({ c } = style);
  });

  it("a", function () {
    s.o.edges.push(s.directions.od53, s.directions.od217);
    expect(s.o.assignDirections(c)).toEqual([1, 2]);
  });

  it("b", function () {
    s.o.edges.push(s.directions.od53, s.directions.od180, s.directions.od270);
    expect(s.o.assignDirections(c)).toEqual([1, 2, 3]);
  });

  it("c", function () {
    s.o.edges.push(s.directions.od37, s.directions.od90, s.directions.od143);
    expect(s.o.assignDirections(c)).toEqual([0, 1, 2]);
  });

  it("d", function () {
    s.o.edges.push(s.directions.od37, s.directions.od76);
    expect(s.o.assignDirections(c)).toEqual([0, 1]);
  });

  it("e", function () {
    s.o.edges.push(s.directions.od37, s.directions.od53, s.directions.od76);
    expect(s.o.assignDirections(c)).toEqual([0, 1, 2]);
  });

  it("f", function () {
    s.o.edges.push(
      s.directions.od0,
      s.directions.od37,
      s.directions.od53,
      s.directions.od76,
    );
    expect(s.o.assignDirections(c)).toEqual([3, 0, 1, 2]);
  });

  it("g", function () {
    s.o.edges.push(
      s.directions.od315,
      s.directions.od333,
      s.directions.od53,
      s.directions.od76,
    );
    expect(s.o.assignDirections(c)).toEqual([1, 2, 3, 0]);
  });

  it("h", function () {
    s.o.edges.push(s.directions.od53, s.directions.od217);

    expect(s.o.assignDirections(new CRegular(4))).toEqual([1, 5]);
  });

  it("i", function () {
    s.o.edges.push(s.directions.od53, s.directions.od180, s.directions.od270);

    expect(s.o.assignDirections(new CRegular(4))).toEqual([1, 4, 6]);
  });

  it("j", function () {
    s.o.edges.push(s.directions.od37, s.directions.od90, s.directions.od143);

    expect(s.o.assignDirections(new CRegular(4))).toEqual([1, 2, 3]);
  });

  it("k", function () {
    s.o.edges.push(s.directions.od37, s.directions.od76);

    expect(s.o.assignDirections(new CRegular(4))).toEqual([1, 2]);
  });

  it("l", function () {
    s.o.edges.push(s.directions.od37, s.directions.od53, s.directions.od76);

    expect(s.o.assignDirections(new CRegular(4))).toEqual([0, 1, 2]);
  });

  it("m", function () {
    s.o.edges.push(
      s.directions.od0,
      s.directions.od14,
      s.directions.od53,
      s.directions.od76,
    );

    expect(s.o.assignDirections(new CRegular(4))).toEqual([7, 0, 1, 2]);
  });

  it("n", function () {
    s.o.edges.push(
      s.directions.od315,
      s.directions.od333,
      s.directions.od53,
      s.directions.od76,
    );

    expect(s.o.assignDirections(new CRegular(4))).toEqual([1, 2, 7, 0]);
  });
});

describe("assignDirections(config.c) on own examples", function () {
  let s: TestSetup;
  let c: C;

  beforeEach(function () {
    s = createEdgeVertexSetup();
    ({ c } = style);
  });

  it("with 4 edges (A) in C(2)", function () {
    s.o.edges.push(
      s.directions.od90,
      s.directions.od143,
      s.directions.od180,
      s.directions.od217,
    );
    expect(s.o.assignDirections(c)).toEqual([0, 1, 2, 3]);
  });

  it("with 4 edges (B) in C(2)", function () {
    s.o.edges.push(
      s.directions.od90,
      s.directions.od104,
      s.directions.od180,
      s.directions.od217,
    );
    expect(s.o.assignDirections(c)).toEqual([0, 1, 2, 3]);
  });

  it("with 4 edges (C) in C(2)", function () {
    s.o.edges.push(
      s.directions.od90,
      s.directions.od153,
      s.directions.od180,
      s.directions.od243,
    );
    expect(s.o.assignDirections(c)).toEqual([0, 1, 2, 3]);
  });

  it("with 4 edges (D) in C(2)", function () {
    s.o.edges.push(
      s.directions.od153,
      s.directions.od166,
      s.directions.od180,
      s.directions.od243,
    );
    expect(s.o.assignDirections(c)).toEqual([0, 1, 2, 3]);
  });

  it("with 4 edges (E) in C(3)", function () {
    s.o.edges.push(
      s.directions.od153,
      s.directions.od166,
      s.directions.od180,
      s.directions.od243,
    );
    expect(s.o.assignDirections(new CRegular(3))).toEqual([1, 2, 3, 4]);
  });

  it("with 4 edges (F) in C(2)", function () {
    s.o.edges.push(s.directions.od0, s.directions.od14, s.directions.od333);
    expect(s.o.assignDirections(c)).toEqual([0, 1, 3]);
  });

  it("with 4 edges (G) in C(2)", function () {
    s.o.edges.push(
      s.directions.od14,
      s.directions.od104,
      s.directions.od243,
      s.directions.od333,
    );
    expect(s.o.assignDirections(c)).toEqual([0, 1, 2, 3]);
  });

  it("with 3 edges (H) in C(2)", function () {
    s.o.edges.push(s.directions.od14, s.directions.od243, s.directions.od284);
    expect(s.o.assignDirections(c)).toEqual([0, 2, 3]);
  });
});
