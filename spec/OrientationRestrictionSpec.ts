import CRegular from "../assets/lib/OrientationRestriction/CRegular";
import Sector from "../assets/lib/OrientationRestriction/Sector";
import { crawlArray } from "../assets/lib/utilities";
import { config } from "../assets/schematization.config";
import { createEdgeVertexSetup, TestSetup } from "./test-setup";

describe("isAligned() works properly", function () {
  let s: TestSetup;
  beforeEach(function () {
    s = createEdgeVertexSetup();
  });

  it("for an aligned edge in a rectilinear schematization.", function () {
    expect(s.directions.od0.isAligned()).toBe(true);
    expect(s.directions.od90.isAligned()).toBe(true);
    expect(s.directions.od180.isAligned()).toBe(true);
    expect(s.directions.od270.isAligned()).toBe(true);
  });

  it("for an aligned edge in an octilinear schematization.", function () {
    s.dcel.config = { ...config, c: new CRegular(4) };
    expect(s.directions.od0.isAligned()).toBe(true);
    expect(s.directions.od90.isAligned()).toBe(true);
    expect(s.directions.od180.isAligned()).toBe(true);
    expect(s.directions.od270.isAligned()).toBe(true);
  });

  it("for an unaligned edge in a rectilinear schematization.", function () {
    expect(s.directions.od37.isAligned()).toBe(false);
    expect(s.directions.od53.isAligned()).toBe(false);
    expect(s.directions.od76.isAligned()).toBe(false);
    expect(s.directions.od143.isAligned()).toBe(false);
    expect(s.directions.od217.isAligned()).toBe(false);
  });

  it("for an unaligned edge in an octilinear schematization.", function () {
    s.dcel.config = { ...config, c: new CRegular(4) };
    expect(s.directions.od37.isAligned()).toBe(false);
    expect(s.directions.od53.isAligned()).toBe(false);
    expect(s.directions.od76.isAligned()).toBe(false);
    expect(s.directions.od143.isAligned()).toBe(false);
  });
});

describe("getNeighbors() returns the neighboring sectors of the sector", function () {
  it("for the 'last' sector.", function () {
    const neighbors = new CRegular(2)
      .getSector(0)
      .getNeighbors()
      .map((neighbor) => neighbor.idx);
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
  let s: TestSetup;
  beforeEach(function () {
    s = createEdgeVertexSetup();
  });

  it("get correct edges in specified sector", function () {
    s.o.edges.push(s.directions.od0, s.directions.od90);
    expect(s.o.getEdgesInSector(new CRegular(2).getSector(0)).length).toBe(2);
  });

  it("get correct edges in specified sector", function () {
    s.o.edges.push(s.directions.od0, s.directions.od90);
    expect(s.o.getEdgesInSector(new CRegular(4).getSector(0)).length).toBe(1);
  });
});

describe("isSignficant()", function () {
  let s: TestSetup;
  beforeEach(function () {
    s = createEdgeVertexSetup();
  });

  it("classifies a vertex correctly", function () {
    s.o.edges.push(s.directions.od0, s.directions.od90);
    expect(s.o.isSignificant()).toBeFalse();
  });

  it("classifies a vertex correctly", function () {
    s.o.edges.push(s.directions.od37, s.directions.od284);
    expect(s.o.isSignificant()).toBeTrue();
  });

  it("classifies a vertex correctly", function () {
    s.o.edges.push(s.directions.od0, s.directions.od180);
    expect(s.o.isSignificant()).toBeFalse();
  });

  it("classifies a vertex correctly", function () {
    s.o.edges.push(s.directions.od0, s.directions.od37);
    expect(s.o.isSignificant()).toBeTrue();
  });

  it("classifies a vertex correctly", function () {
    s.o.edges.push(s.directions.od104, s.directions.od37);
    expect(s.o.isSignificant()).toBeTrue();
  });

  it("classifies a vertex with edges in disjoint sectors as not significant.", function () {
    s.o.edges.push(s.directions.od217, s.directions.od37);
    expect(s.o.isSignificant()).toBeFalse();
  });
});

describe("the sector of edges incident to a vertex are correctly identified", function () {
  let s: TestSetup;
  beforeEach(function () {
    s = createEdgeVertexSetup();
  });

  it("using getAssociatedSector() for C2", function () {
    expect(s.directions.od0.getAssociatedSector()).toEqual([
      new CRegular(2).getSector(0),
      new CRegular(2).getSector(3),
    ]);
    expect(s.directions.od90.getAssociatedSector()).toEqual([
      new CRegular(2).getSector(0),
      new CRegular(2).getSector(1),
    ]);
    expect(s.directions.od180.getAssociatedSector()).toEqual([
      new CRegular(2).getSector(1),
      new CRegular(2).getSector(2),
    ]);
    expect(s.directions.od270.getAssociatedSector()).toEqual([
      new CRegular(2).getSector(2),
      new CRegular(2).getSector(3),
    ]);
  });

  it("using getAssociatedSector() for C4", function () {
    s.dcel.config = { ...config, c: new CRegular(4) };
    expect(s.directions.od0.getAssociatedSector()).toEqual([
      new CRegular(4).getSector(0),
      new CRegular(4).getSector(7),
    ]);
    expect(s.directions.od90.getAssociatedSector()).toEqual([
      new CRegular(4).getSector(1),
      new CRegular(4).getSector(2),
    ]);
    expect(s.directions.od180.getAssociatedSector()).toEqual([
      new CRegular(4).getSector(3),
      new CRegular(4).getSector(4),
    ]);
    expect(s.directions.od270.getAssociatedSector()).toEqual([
      new CRegular(4).getSector(5),
      new CRegular(4).getSector(6),
    ]);
  });

  it("using getAssociatedAngles() for C2", function () {
    expect(s.directions.od0.getAssociatedAngles()).toEqual([0]);
    expect(s.directions.od90.getAssociatedAngles()).toEqual([Math.PI * 0.5]);
    expect(s.directions.od180.getAssociatedAngles()).toEqual([Math.PI]);
    expect(s.directions.od270.getAssociatedAngles()).toEqual([Math.PI * 1.5]);
    expect(s.directions.od37.getAssociatedAngles()).toEqual([0, Math.PI * 0.5]);
    expect(s.directions.od284.getAssociatedAngles()).toEqual([Math.PI * 1.5, Math.PI * 2]);
  });

  it("using getAssociatedAngles() for C4", function () {
    s.dcel.config = { ...config, c: new CRegular(4) };
    expect(s.directions.od0.getAssociatedAngles()).toEqual([0]);
    expect(s.directions.od90.getAssociatedAngles()).toEqual([Math.PI * 0.5]);
    expect(s.directions.od180.getAssociatedAngles()).toEqual([Math.PI]);
    expect(s.directions.od270.getAssociatedAngles()).toEqual([Math.PI * 1.5]);
    expect(s.directions.od37.getAssociatedAngles()).toEqual([0, Math.PI * 0.25]);
    expect(s.directions.od284.getAssociatedAngles()).toEqual([Math.PI * 1.5, Math.PI * 1.75]);
  });
});

describe("crawlArray()", function () {
  let arr: (string | number)[] = [];
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
