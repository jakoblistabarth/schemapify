import { createEdgeVertexSetup, TestSetup } from "./test-setup";
import C from "../assets/lib/OrientationRestriction/C";
import { config } from "../assets/schematization.config";

describe("Given the examples in the paper of buchin et al., directions are assigned, correctly on example", function () {
  let s: TestSetup;
  beforeEach(function () {
    s = createEdgeVertexSetup();
  });

  it("a", function () {
    s.o.edges.push(s.directions.od53, s.directions.od217);
    expect(s.o.assignDirections().map((edge) => edge.assignedDirection)).toEqual([1, 2]);
  });

  it("b", function () {
    s.o.edges.push(s.directions.od53, s.directions.od180, s.directions.od270);
    expect(s.o.assignDirections().map((edge) => edge.assignedDirection)).toEqual([1, 2, 3]);
  });

  it("c", function () {
    s.o.edges.push(s.directions.od37, s.directions.od90, s.directions.od143);
    expect(s.o.assignDirections().map((edge) => edge.assignedDirection)).toEqual([0, 1, 2]);
  });

  it("d", function () {
    s.o.edges.push(s.directions.od37, s.directions.od76);
    expect(s.o.assignDirections().map((edge) => edge.assignedDirection)).toEqual([0, 1]);
  });

  it("e", function () {
    s.o.edges.push(s.directions.od37, s.directions.od53, s.directions.od76);
    expect(s.o.assignDirections().map((edge) => edge.assignedDirection)).toEqual([0, 1, 2]);
  });

  it("f", function () {
    s.o.edges.push(s.directions.od0, s.directions.od37, s.directions.od53, s.directions.od76);
    expect(s.o.assignDirections().map((edge) => edge.assignedDirection)).toEqual([3, 0, 1, 2]);
  });

  it("g", function () {
    s.o.edges.push(s.directions.od315, s.directions.od333, s.directions.od53, s.directions.od76);
    expect(s.o.assignDirections().map((edge) => edge.assignedDirection)).toEqual([1, 2, 3, 0]);
  });

  it("h", function () {
    s.o.edges.push(s.directions.od53, s.directions.od217);
    s.dcel.config = { ...config, c: new C(4) };

    expect(s.o.assignDirections().map((edge) => edge.assignedDirection)).toEqual([1, 5]);
  });

  it("i", function () {
    s.o.edges.push(s.directions.od53, s.directions.od180, s.directions.od270);
    s.dcel.config = { ...config, c: new C(4) };

    expect(s.o.assignDirections().map((edge) => edge.assignedDirection)).toEqual([1, 4, 6]);
  });

  it("j", function () {
    s.o.edges.push(s.directions.od37, s.directions.od90, s.directions.od143);
    s.dcel.config = { ...config, c: new C(4) };

    expect(s.o.assignDirections().map((edge) => edge.assignedDirection)).toEqual([1, 2, 3]);
  });

  it("k", function () {
    s.o.edges.push(s.directions.od37, s.directions.od76);
    s.dcel.config = { ...config, c: new C(4) };

    expect(s.o.assignDirections().map((edge) => edge.assignedDirection)).toEqual([1, 2]);
  });

  it("l", function () {
    s.o.edges.push(s.directions.od37, s.directions.od53, s.directions.od76);
    s.dcel.config = { ...config, c: new C(4) };

    expect(s.o.assignDirections().map((edge) => edge.assignedDirection)).toEqual([0, 1, 2]);
  });

  it("m", function () {
    s.o.edges.push(s.directions.od0, s.directions.od14, s.directions.od53, s.directions.od76);
    s.dcel.config = { ...config, c: new C(4) };

    expect(s.o.assignDirections().map((edge) => edge.assignedDirection)).toEqual([7, 0, 1, 2]);
  });

  it("n", function () {
    s.o.edges.push(s.directions.od315, s.directions.od333, s.directions.od53, s.directions.od76);
    s.dcel.config = { ...config, c: new C(4) };

    expect(s.o.assignDirections().map((edge) => edge.assignedDirection)).toEqual([1, 2, 7, 0]);
  });
});

describe("assignDirections() on own examples", function () {
  let s: TestSetup;
  beforeEach(function () {
    s = createEdgeVertexSetup();
  });

  it("with 4 edges (A) in C(2)", function () {
    s.o.edges.push(s.directions.od90, s.directions.od143, s.directions.od180, s.directions.od217);
    expect(s.o.assignDirections().map((edge) => edge.assignedDirection)).toEqual([1, 2, 3, 0]);
  });

  it("with 4 edges (B) in C(2)", function () {
    s.o.edges.push(s.directions.od90, s.directions.od104, s.directions.od180, s.directions.od217);
    expect(s.o.assignDirections().map((edge) => edge.assignedDirection)).toEqual([0, 1, 2, 3]);
  });

  it("with 4 edges (C) in C(2)", function () {
    s.o.edges.push(s.directions.od90, s.directions.od153, s.directions.od180, s.directions.od243);
    expect(s.o.assignDirections().map((edge) => edge.assignedDirection)).toEqual([1, 2, 3, 0]);
  });

  it("with 4 edges (D) in C(2)", function () {
    s.o.edges.push(s.directions.od153, s.directions.od166, s.directions.od180, s.directions.od243);
    expect(s.o.assignDirections().map((edge) => edge.assignedDirection)).toEqual([1, 2, 3, 0]);
  });

  fit("with 4 edges (D) in C(3)", function () {
    s.o.edges.push(s.directions.od153, s.directions.od166, s.directions.od180, s.directions.od243);
    s.dcel.config = { ...config, c: new C(3) };
    expect(s.o.assignDirections().map((edge) => edge.assignedDirection)).toEqual([3, 4, 5, 0]);
  });
});
