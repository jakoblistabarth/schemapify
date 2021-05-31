import { createEdgeVertexSetup } from "./test-helpers.mjs";

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
    ).toEqual([3, 0, 1, 2]);
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
    s.o.edges.push(s.od0, s.od37, s.od53, s.od76);
    expect(
      s.o.assignDirections(s.c4).map((edge) => edge.schematizationProperties.direction)
    ).toEqual([7, 0, 1, 2]);
  });

  it("n", function () {
    s.o.edges.push(s.od315, s.od333, s.od53, s.od76);
    expect(
      s.o.assignDirections(s.c4).map((edge) => edge.schematizationProperties.direction)
    ).toEqual([7, 0, 1, 2]);
  });
});

xdescribe("Given the examples in the paper of buchin et al., classify() works as expected on example", function () {
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
    expect(s.od53.classify(s.c2)).toBe("unalignedBasic");
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
    expect(s.od76.classify(s.c2)).toBe("deviating");
  });

  it("f", function () {
    s.o.edges.push(s.od0, s.od37, s.od53, s.od76);
    expect(s.od0.classify(s.c2)).toBe("deviating");
    expect(s.od37.classify(s.c2)).toBe("evading");
    expect(s.od53.classify(s.c2)).toBe("evading");
    expect(s.od76.classify(s.c2)).toBe("deviating");
  });

  it("g", function () {
    s.o.edges.push(s.od315, s.od333, s.od53, s.od76);
    expect(s.od315.classify(s.c2)).toBe("evading");
    expect(s.od333.classify(s.c2)).toBe("evading");
    expect(s.od53.classify(s.c2)).toBe("unalignedBasic");
    expect(s.od76.classify(s.c2)).toBe("deviating");
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
    s.o.edges.push(s.od0, s.od37, s.od53, s.od76);
    expect(s.od0.classify(s.c4)).toBe("deviating");
    expect(s.od37.classify(s.c4)).toBe("unalignedBasic");
    expect(s.od53.classify(s.c4)).toBe("evading");
    expect(s.od76.classify(s.c4)).toBe("evading");
  });

  it("g", function () {
    s.o.edges.push(s.od315, s.od333, s.od53, s.od76);
    expect(s.od315.classify(s.c4)).toBe("alignedBasic");
    expect(s.od333.classify(s.c4)).toBe("unalignedBasic");
    expect(s.od53.classify(s.c4)).toBe("evading");
    expect(s.od76.classify(s.c4)).toBe("evading");
  });
});
