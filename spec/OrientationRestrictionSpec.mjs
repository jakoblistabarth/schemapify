import { createEdgeVertexSetup } from "./test-helpers.mjs";

describe("isInSector()", function () {
  let s;
  beforeEach(function () {
    s = createEdgeVertexSetup();
  });

  it("returns true for edges in specified sector", function () {
    expect(s.od14.isInSector(s.c2[0])).toBe(true);
  });

  it("returns true for edges in specified sector", function () {
    expect(s.od0.isInSector(s.c2[0])).toBe(true);
  });
});

describe("getEdgesInSector()", function () {
  let s;
  beforeEach(function () {
    s = createEdgeVertexSetup();
  });

  it("get correct edges in specified sector", function () {
    s.o.edges.push(s.od0, s.od90);
    expect(s.o.getEdgesInSector(s.c2[0]).length).toBe(2);
  });
});

describe("isSignficant()", function () {
  let s;
  beforeEach(function () {
    s = createEdgeVertexSetup();
  });

  it("classifies a vertex correctly", function () {
    s.o.edges.push(s.od0, s.od90);
    expect(s.o.isSignificant(s.c2)).toBe(false);
  });

  it("classifies a vertex correctly", function () {
    s.o.edges.push(s.od14, s.od284);
    expect(s.o.isSignificant(s.c2)).toBe(true);
  });

  it("classifies a vertex correctly", function () {
    s.o.edges.push(s.od0, s.od180);
    expect(s.o.isSignificant(s.c2)).toBe(false);
  });

  it("classifies a vertex correctly", function () {
    s.o.edges.push(s.od0, s.od14);
    expect(s.o.isSignificant()).toBe(true);
  });

  it("classifies a vertex correctly", function () {
    s.o.edges.push(s.od104, s.od14);
    expect(s.o.isSignificant()).toBe(true);
  });

  fit("classifies a vertex with edges in disjoint sectors as not significant.", function () {
    s.o.edges.push(s.od225, s.od14);
    expect(s.o.isSignificant()).toBe(false);
  });
});

describe("the sector of edges incident to a vertex are correctly identified", function () {
  let s;
  beforeEach(function () {
    s = createEdgeVertexSetup();
  });

  it("using getSectorIndex() for C2", function () {
    expect(s.od0.getSectorIndex(s.c2)).toEqual([0, 3]);
    expect(s.od90.getSectorIndex(s.c2)).toEqual([0, 1]);
    expect(s.od180.getSectorIndex(s.c2)).toEqual([1, 2]);
    expect(s.od270.getSectorIndex(s.c2)).toEqual([2, 3]);
  });

  it("using getSectorIndex() for C4", function () {
    expect(s.od0.getSectorIndex(s.c4)).toEqual([0, 7]);
    expect(s.od90.getSectorIndex(s.c4)).toEqual([1, 2]);
    expect(s.od180.getSectorIndex(s.c4)).toEqual([3, 4]);
    expect(s.od270.getSectorIndex(s.c4)).toEqual([5, 6]);
  });

  it("using getAssociatedDirections() for C2", function () {
    expect(s.od0.getAssociatedDirections(s.c2)).toEqual([0]);
    expect(s.od90.getAssociatedDirections(s.c2)).toEqual([Math.PI * 0.5]);
    expect(s.od180.getAssociatedDirections(s.c2)).toEqual([Math.PI]);
    expect(s.od270.getAssociatedDirections(s.c2)).toEqual([Math.PI * 1.5]);
    expect(s.od14.getAssociatedDirections(s.c2)).toEqual([0, Math.PI * 0.5]);
    expect(s.od284.getAssociatedDirections(s.c2)).toEqual([Math.PI * 1.5, Math.PI * 2]);
  });

  it("using getAssociatedDirections() for C4", function () {
    expect(s.od0.getAssociatedDirections(s.c4)).toEqual([0]);
    expect(s.od90.getAssociatedDirections(s.c4)).toEqual([Math.PI * 0.5]);
    expect(s.od180.getAssociatedDirections(s.c4)).toEqual([Math.PI]);
    expect(s.od270.getAssociatedDirections(s.c4)).toEqual([Math.PI * 1.5]);
    expect(s.od14.getAssociatedDirections(s.c4)).toEqual([0, Math.PI * 0.25]);
    expect(s.od284.getAssociatedDirections(s.c4)).toEqual([Math.PI * 1.5, Math.PI * 1.75]);
  });
});
