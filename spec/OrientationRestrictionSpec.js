const setup = require("./test-setup.js");
const crawlArray = require("../dist/cjs/lib/utilities.js").crawlArray;
const Sector = require("../dist/cjs/lib/OrientationRestriction/Sector.js").default;
const C = require("../dist/cjs/lib/OrientationRestriction/C.js").default;
const Significance = require("../dist/cjs/lib/dcel/Vertex.js").Significance;

describe("isAligned() works properly", function () {
  let s;
  beforeEach(function () {
    s = setup.createEdgeVertexSetup();
  });

  it("for an aligned edge in a rectilinear schematization.", function () {
    s.dcel.config = { c: new C(2) };
    expect(s.od0.isAligned()).toBe(true);
    expect(s.od90.isAligned()).toBe(true);
    expect(s.od180.isAligned()).toBe(true);
    expect(s.od270.isAligned()).toBe(true);
  });

  it("for an aligned edge in an octilinear schematization.", function () {
    s.dcel.config = { c: new C(4) };
    expect(s.od0.isAligned()).toBe(true);
    expect(s.od90.isAligned()).toBe(true);
    expect(s.od180.isAligned()).toBe(true);
    expect(s.od270.isAligned()).toBe(true);
  });

  it("for an unaligned edge in a rectilinear schematization.", function () {
    s.dcel.config = { c: new C(2) };
    expect(s.od37.isAligned()).toBe(false);
    expect(s.od53.isAligned()).toBe(false);
    expect(s.od76.isAligned()).toBe(false);
    expect(s.od143.isAligned()).toBe(false);
    expect(s.od217.isAligned()).toBe(false);
  });

  it("for an unaligned edge in an octilinear schematization.", function () {
    s.dcel.config = { c: new C(4) };
    expect(s.od37.isAligned()).toBe(false);
    expect(s.od53.isAligned()).toBe(false);
    expect(s.od76.isAligned()).toBe(false);
    expect(s.od143.isAligned()).toBe(false);
  });
});

describe("getNeighbors() returns the neighboring sectors of the sector", function () {
  it("for the 'last' sector.", function () {
    const neighbors = new C(2)
      .getSector(0)
      .getNeighbors()
      .map((neighbor) => neighbor.idx);
    expect(neighbors).toEqual([3, 1]);
  });
});

describe("encloses()", function () {
  let sector;
  beforeEach(function () {
    sector = new Sector(new C(2), 0, 0, Math.PI / 2);
  });

  it("returns true sector bounds", function () {
    expect(sector.encloses(0)).toBe(true);
    expect(sector.encloses(Math.PI / 2)).toBe(true);
  });

  it("returns true enclosed values", function () {
    expect(sector.encloses(Math.PI / 4)).toBe(true);
  });

  it("returns false for values outside of sector", function () {
    expect(sector.encloses(Math.PI / 2 + 0.01)).toBe(false);
  });
});

describe("getEdgesInSector()", function () {
  let s;
  beforeEach(function () {
    s = setup.createEdgeVertexSetup();
  });

  it("get correct edges in specified sector", function () {
    s.o.edges.push(s.od0, s.od90);
    expect(s.o.getEdgesInSector(new C(2).getSector(0)).length).toBe(2);
  });

  it("get correct edges in specified sector", function () {
    s.o.edges.push(s.od0, s.od90);
    expect(s.o.getEdgesInSector(new C(4).getSector(0)).length).toBe(1);
  });
});

describe("isSignficant()", function () {
  let s;
  beforeEach(function () {
    s = setup.createEdgeVertexSetup();
  });

  it("classifies a vertex correctly", function () {
    s.o.edges.push(s.od0, s.od90);
    s.dcel.config = { c: new C(2) };
    expect(s.o.isSignificant()).toBe(Significance.I);
  });

  it("classifies a vertex correctly", function () {
    s.o.edges.push(s.od37, s.od284);
    s.dcel.config = { c: new C(2) };
    expect(s.o.isSignificant()).toBe(Significance.S);
  });

  it("classifies a vertex correctly", function () {
    s.o.edges.push(s.od0, s.od180);
    s.dcel.config = { c: new C(2) };
    expect(s.o.isSignificant()).toBe(Significance.I);
  });

  it("classifies a vertex correctly", function () {
    s.o.edges.push(s.od0, s.od37);
    s.dcel.config = { c: new C(2) };
    expect(s.o.isSignificant()).toBe(Significance.S);
  });

  it("classifies a vertex correctly", function () {
    s.o.edges.push(s.od104, s.od37);
    s.dcel.config = { c: new C(2) };
    expect(s.o.isSignificant()).toBe(Significance.S);
  });

  it("classifies a vertex with edges in disjoint sectors as not significant.", function () {
    s.o.edges.push(s.od217, s.od37);
    s.dcel.config = { c: new C(2) };
    expect(s.o.isSignificant()).toBe(Significance.I);
  });
});

describe("the sector of edges incident to a vertex are correctly identified", function () {
  let s;
  beforeEach(function () {
    s = setup.createEdgeVertexSetup();
  });

  it("using getAssociatedSector() for C2", function () {
    s.dcel.config = { c: new C(2) };
    expect(s.od0.getAssociatedSector()).toEqual([new C(2).getSector(0), new C(2).getSector(3)]);
    expect(s.od90.getAssociatedSector()).toEqual([new C(2).getSector(0), new C(2).getSector(1)]);
    expect(s.od180.getAssociatedSector()).toEqual([new C(2).getSector(1), new C(2).getSector(2)]);
    expect(s.od270.getAssociatedSector()).toEqual([new C(2).getSector(2), new C(2).getSector(3)]);
  });

  it("using getAssociatedSector() for C4", function () {
    s.dcel.config = { c: new C(4) };
    expect(s.od0.getAssociatedSector()).toEqual([new C(4).getSector(0), new C(4).getSector(7)]);
    expect(s.od90.getAssociatedSector()).toEqual([new C(4).getSector(1), new C(4).getSector(2)]);
    expect(s.od180.getAssociatedSector()).toEqual([new C(4).getSector(3), new C(4).getSector(4)]);
    expect(s.od270.getAssociatedSector()).toEqual([new C(4).getSector(5), new C(4).getSector(6)]);
  });

  it("using getAssociatedDirections() for C2", function () {
    s.dcel.config = { c: new C(2) };
    expect(s.od0.getAssociatedDirections()).toEqual([0]);
    expect(s.od90.getAssociatedDirections()).toEqual([Math.PI * 0.5]);
    expect(s.od180.getAssociatedDirections()).toEqual([Math.PI]);
    expect(s.od270.getAssociatedDirections()).toEqual([Math.PI * 1.5]);
    expect(s.od37.getAssociatedDirections()).toEqual([0, Math.PI * 0.5]);
    expect(s.od284.getAssociatedDirections()).toEqual([Math.PI * 1.5, Math.PI * 2]);
  });

  it("using getAssociatedDirections() for C4", function () {
    s.dcel.config = { c: new C(4) };
    expect(s.od0.getAssociatedDirections()).toEqual([0]);
    expect(s.od90.getAssociatedDirections()).toEqual([Math.PI * 0.5]);
    expect(s.od180.getAssociatedDirections()).toEqual([Math.PI]);
    expect(s.od270.getAssociatedDirections()).toEqual([Math.PI * 1.5]);
    expect(s.od37.getAssociatedDirections()).toEqual([0, Math.PI * 0.25]);
    expect(s.od284.getAssociatedDirections()).toEqual([Math.PI * 1.5, Math.PI * 1.75]);
  });
});

describe("crawlArray()", function () {
  let arr;
  beforeEach(function () {
    arr = ["first", "second", 2, 3, 4, 5, "secondlast", "last"];
  });

  it("crawls forward +2", function () {
    expect(arr[crawlArray(arr, 6, +2)]).toBe("first");
  });

  it("crawls forward +1", function () {
    expect(arr[crawlArray(arr, 7, +1)]).toBe("first");
  });

  it("crawls backward -1", function () {
    expect(arr[crawlArray(arr, 0, -1)]).toBe("last");
  });

  it("crawls backward -2", function () {
    expect(arr[crawlArray(arr, 0, -2)]).toBe("secondlast");
  });
});
