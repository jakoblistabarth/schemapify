import CRegular from "@/src/c-oriented-schematization/CRegular";
import Sector from "@/src/c-oriented-schematization/Sector";
import { crawlArray } from "@/src/utilities";
import { style } from "@/src/c-oriented-schematization/schematization.style";
import { createEdgeVertexSetup, TestSetup } from "./test-setup";
import C from "@/src/c-oriented-schematization/C";

describe("isAligned() works properly", function () {
  let s: TestSetup;
  let c: C;
  beforeEach(function () {
    s = createEdgeVertexSetup();
    ({ c } = style);
  });

  it("for an aligned edge in a rectilinear schematization.", function () {
    expect(s.directions.od0.isAligned(c.sectors)).toBe(true);
    expect(s.directions.od90.isAligned(c.sectors)).toBe(true);
    expect(s.directions.od180.isAligned(c.sectors)).toBe(true);
    expect(s.directions.od270.isAligned(c.sectors)).toBe(true);
  });

  it("for an aligned edge in an octilinear schematization.", function () {
    expect(s.directions.od0.isAligned(new CRegular(4).sectors)).toBe(true);
    expect(s.directions.od90.isAligned(new CRegular(4).sectors)).toBe(true);
    expect(s.directions.od180.isAligned(new CRegular(4).sectors)).toBe(true);
    expect(s.directions.od270.isAligned(new CRegular(4).sectors)).toBe(true);
  });

  it("for an unaligned edge in a rectilinear schematization.", function () {
    expect(s.directions.od37.isAligned(c.sectors)).toBe(false);
    expect(s.directions.od53.isAligned(c.sectors)).toBe(false);
    expect(s.directions.od76.isAligned(c.sectors)).toBe(false);
    expect(s.directions.od143.isAligned(c.sectors)).toBe(false);
    expect(s.directions.od217.isAligned(c.sectors)).toBe(false);
  });

  it("for an unaligned edge in an octilinear schematization.", function () {
    expect(s.directions.od37.isAligned(new CRegular(4).sectors)).toBe(false);
    expect(s.directions.od53.isAligned(new CRegular(4).sectors)).toBe(false);
    expect(s.directions.od76.isAligned(new CRegular(4).sectors)).toBe(false);
    expect(s.directions.od143.isAligned(new CRegular(4).sectors)).toBe(false);
  });
});

describe("getNeighbors() returns the neighboring sectors of the sector", function () {
  it("for the 'last' sector.", function () {
    const sector0 = new CRegular(2).getSector(0) as Sector;

    const neighbors = sector0.getNeighbors().map((neighbor) => neighbor.idx);
    expect(neighbors).toEqual([3, 1]);
  });
});

describe("encloses()", function () {
  let sector: Sector;
  beforeEach(function () {
    sector = new Sector(new CRegular(2), 0, 0, Math.PI * 0.5);
  });

  it("returns true sector bounds", function () {
    expect(sector.encloses(0)).toBe(true);
    expect(sector.encloses(Math.PI * 0.5)).toBe(true);
  });

  it("returns true enclosed values", function () {
    expect(sector.encloses(Math.PI * 0.25)).toBe(true);
  });

  it("returns false for values outside of sector", function () {
    expect(sector.encloses(Math.PI * 0.5 + 0.01)).toBe(false);
  });
});

describe("getEdgesInSector()", function () {
  let s: TestSetup;
  beforeEach(function () {
    s = createEdgeVertexSetup();
  });

  it("get correct edges in specified sector", function () {
    s.o.edges.push(s.directions.od0, s.directions.od90);
    const sector0 = new CRegular(2).getSector(0) as Sector;
    expect(s.o.getEdgesInSector(sector0).length).toBe(2);
  });

  it("get correct edges in specified sector", function () {
    s.o.edges.push(s.directions.od0, s.directions.od90);
    const sector0 = new CRegular(4).getSector(0) as Sector;
    expect(s.o.getEdgesInSector(sector0).length).toBe(1);
  });
});

describe("isSignficant()", function () {
  let s: TestSetup;
  let c: C;
  beforeEach(function () {
    s = createEdgeVertexSetup();
    ({ c } = style);
  });

  it("classifies a vertex correctly", function () {
    s.o.edges.push(s.directions.od0, s.directions.od90);
    expect(s.o.isSignificant(c.sectors)).toBe(false);
  });

  it("classifies a vertex correctly", function () {
    s.o.edges.push(s.directions.od37, s.directions.od284);
    expect(s.o.isSignificant(c.sectors)).toBe(true);
  });

  it("classifies a vertex correctly", function () {
    s.o.edges.push(s.directions.od0, s.directions.od180);
    expect(s.o.isSignificant(c.sectors)).toBe(false);
  });

  it("classifies a vertex correctly", function () {
    s.o.edges.push(s.directions.od0, s.directions.od37);
    expect(s.o.isSignificant(c.sectors)).toBe(true);
  });

  it("classifies a vertex correctly", function () {
    s.o.edges.push(s.directions.od104, s.directions.od37);
    expect(s.o.isSignificant(c.sectors)).toBe(true);
  });

  it("classifies a vertex with edges in disjoint sectors as not significant.", function () {
    s.o.edges.push(s.directions.od217, s.directions.od37);
    expect(s.o.isSignificant(c.sectors)).toBe(false);
  });
});

describe("the sector of edges incident to a vertex are correctly identified", function () {
  let s: TestSetup;
  let c: C;
  beforeEach(function () {
    s = createEdgeVertexSetup();
    ({ c } = style);
  });

  it("using getAssociatedSector() for C2", function () {
    expect(s.directions.od0.getAssociatedSector(c.sectors)).toEqual([
      new CRegular(2).getSector(0) as Sector,
      new CRegular(2).getSector(3) as Sector,
    ]);
    expect(s.directions.od90.getAssociatedSector(c.sectors)).toEqual([
      new CRegular(2).getSector(0) as Sector,
      new CRegular(2).getSector(1) as Sector,
    ]);
    expect(s.directions.od180.getAssociatedSector(c.sectors)).toEqual([
      new CRegular(2).getSector(1) as Sector,
      new CRegular(2).getSector(2) as Sector,
    ]);
    expect(s.directions.od270.getAssociatedSector(c.sectors)).toEqual([
      new CRegular(2).getSector(2) as Sector,
      new CRegular(2).getSector(3) as Sector,
    ]);
  });

  it("using getAssociatedSector() for C4", function () {
    expect(
      s.directions.od0.getAssociatedSector(new CRegular(4).sectors),
    ).toEqual([
      new CRegular(4).getSector(0) as Sector,
      new CRegular(4).getSector(7) as Sector,
    ]);
    expect(
      s.directions.od90.getAssociatedSector(new CRegular(4).sectors),
    ).toEqual([
      new CRegular(4).getSector(1) as Sector,
      new CRegular(4).getSector(2) as Sector,
    ]);
    expect(
      s.directions.od180.getAssociatedSector(new CRegular(4).sectors),
    ).toEqual([
      new CRegular(4).getSector(3) as Sector,
      new CRegular(4).getSector(4) as Sector,
    ]);
    expect(
      s.directions.od270.getAssociatedSector(new CRegular(4).sectors),
    ).toEqual([
      new CRegular(4).getSector(5) as Sector,
      new CRegular(4).getSector(6) as Sector,
    ]);
  });

  it("using getAssociatedAngles() for C2", function () {
    expect(s.directions.od0.getAssociatedAngles(c.sectors)).toEqual([0]);
    expect(s.directions.od90.getAssociatedAngles(c.sectors)).toEqual([
      Math.PI * 0.5,
    ]);
    expect(s.directions.od180.getAssociatedAngles(c.sectors)).toEqual([
      Math.PI,
    ]);
    expect(s.directions.od270.getAssociatedAngles(c.sectors)).toEqual([
      Math.PI * 1.5,
    ]);
    expect(s.directions.od37.getAssociatedAngles(c.sectors)).toEqual([
      0,
      Math.PI * 0.5,
    ]);
    expect(s.directions.od284.getAssociatedAngles(c.sectors)).toEqual([
      Math.PI * 1.5,
      Math.PI * 2,
    ]);
  });

  it("using getAssociatedAngles() for C4", function () {
    expect(
      s.directions.od0.getAssociatedAngles(new CRegular(4).sectors),
    ).toEqual([0]);
    expect(
      s.directions.od90.getAssociatedAngles(new CRegular(4).sectors),
    ).toEqual([Math.PI * 0.5]);
    expect(
      s.directions.od180.getAssociatedAngles(new CRegular(4).sectors),
    ).toEqual([Math.PI]);
    expect(
      s.directions.od270.getAssociatedAngles(new CRegular(4).sectors),
    ).toEqual([Math.PI * 1.5]);
    expect(
      s.directions.od37.getAssociatedAngles(new CRegular(4).sectors),
    ).toEqual([0, Math.PI * 0.25]);
    expect(
      s.directions.od284.getAssociatedAngles(new CRegular(4).sectors),
    ).toEqual([Math.PI * 1.5, Math.PI * 1.75]);
  });
});

describe("crawlArray()", function () {
  let arr: (string | number)[] = [];
  beforeEach(function () {
    arr = ["first", "second", 2, 3, 4, 5, "secondlast", "last"];
  });

  it("crawls forward +2", function () {
    expect(crawlArray(arr, 6, +2)).toBe("first");
  });

  it("crawls forward +1", function () {
    expect(crawlArray(arr, 7, +1)).toBe("first");
  });

  it("crawls backward -1", function () {
    expect(crawlArray(arr, 0, -1)).toBe("last");
  });

  it("crawls backward -2", function () {
    expect(crawlArray(arr, 0, -2)).toBe("secondlast");
  });
});
