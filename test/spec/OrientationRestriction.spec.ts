import C from "@/src/c-oriented-schematization/C";
import CRegular from "@/src/c-oriented-schematization/CRegular";
import {
  getAssociatedAngles,
  getAssociatedSector,
  isAligned,
} from "@/src/c-oriented-schematization/HalfEdgeUtils";
import { style } from "@/src/c-oriented-schematization/schematization.style";
import Sector from "@/src/c-oriented-schematization/Sector";
import VertexClassGenerator from "@/src/c-oriented-schematization/VertexClassGenerator";
import { getEdgesInSector } from "@/src/c-oriented-schematization/VertexUtils";
import Dcel from "@/src/Dcel/Dcel";
import { DECIMAL_SCALE, TWO_PI } from "@/src/geometry/constants";
import { crawlArray, degreesToRadians } from "@/src/utilities";
import { beforeEach, describe, expect, test } from "vitest";
import { createEdgeVertexSetup, idOr, TestSetup } from "./test-setup";

describe("isAligned() works properly", function () {
  let s: TestSetup;

  beforeEach(function () {
    s = createEdgeVertexSetup();
  });

  test("for an aligned edge in a rectilinear schematization.", function () {
    const sectors = new CRegular(2).sectors;
    expect(isAligned(s.directions.od0, sectors)).toBe(true);
    expect(isAligned(s.directions.od90, sectors)).toBe(true);
    expect(isAligned(s.directions.od180, sectors)).toBe(true);
    expect(isAligned(s.directions.od270, sectors)).toBe(true);
  });

  test("for an aligned edge in an octilinear schematization.", function () {
    const sectors = new CRegular(4).sectors;
    expect(isAligned(s.directions.od0, sectors)).toBe(true);
    expect(isAligned(s.directions.od90, sectors)).toBe(true);
    expect(isAligned(s.directions.od180, sectors)).toBe(true);
    expect(isAligned(s.directions.od270, sectors)).toBe(true);
  });

  test("for an unaligned edge in a rectilinear schematization.", function () {
    const sectors = new CRegular(2).sectors;
    expect(isAligned(s.directions.od37, sectors)).toBe(false);
    expect(isAligned(s.directions.od53, sectors)).toBe(false);
    expect(isAligned(s.directions.od76, sectors)).toBe(false);
    expect(isAligned(s.directions.od143, sectors)).toBe(false);
    expect(isAligned(s.directions.od217, sectors)).toBe(false);
  });

  test("for an unaligned edge in an octilinear schematization.", function () {
    const sectors = new CRegular(4).sectors;
    expect(isAligned(s.directions.od37, sectors)).toBe(false);
    expect(isAligned(s.directions.od53, sectors)).toBe(false);
    expect(isAligned(s.directions.od76, sectors)).toBe(false);
    expect(isAligned(s.directions.od143, sectors)).toBe(false);
  });
});

describe("getNeighbors() returns the neighboring sectors of the sector", function () {
  test("for the 'last' sector.", function () {
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

  test("returns true for sector bounds", function () {
    expect(sector.encloses(0)).toBe(true);
    expect(sector.encloses(Math.PI * 0.5)).toBe(true);
  });

  test("returns true for enclosed values", function () {
    expect(sector.encloses(Math.PI * 0.25)).toBe(true);
  });

  test("returns false for values outside of sector", function () {
    expect(sector.encloses(Math.PI * 0.5 + 0.01)).toBe(false);
  });
});

describe("getEdgesInSector()", function () {
  let s: TestSetup;
  beforeEach(function () {
    s = createEdgeVertexSetup();
  });

  test("get correct edges in specified sector", function () {
    s.origin.edges.push(s.directions.od0, s.directions.od90);
    const sector0 = new CRegular(2).getSector(0) as Sector;
    expect(getEdgesInSector(s.origin, sector0).length).toBe(2);
  });

  test("get correct edges in specified sector", function () {
    s.origin.edges.push(s.directions.od0, s.directions.od90);
    const sector0 = new CRegular(4).getSector(0) as Sector;
    expect(getEdgesInSector(s.origin, sector0).length).toBe(1);
  });
});

describe("isSignficant()", function () {
  let s: TestSetup;
  beforeEach(function () {
    s = createEdgeVertexSetup();
  });

  const isSignificant = () => {
    const { dcel, origin } = s;
    const significantVertices = new VertexClassGenerator(style.c.sectors).run(
      dcel,
    );
    return significantVertices.includes(idOr(origin));
  };

  test("classifies a vertex correctly (A)", function () {
    s.dcel.getVertices()[0].edges.push(s.directions.od0, s.directions.od90);
    expect(isSignificant()).toBe(false);
  });

  test("classifies a vertex correctly (B)", function () {
    s.dcel.getVertices()[0].edges.push(s.directions.od37, s.directions.od284);
    expect(isSignificant()).toBe(true);
  });

  test("classifies a vertex correctly", function () {
    s.dcel.getVertices()[0].edges.push(s.directions.od0, s.directions.od180);
    expect(isSignificant()).toBe(false);
  });

  test("classifies a vertex correctly", function () {
    s.dcel.getVertices()[0].edges.push(s.directions.od0, s.directions.od37);
    expect(isSignificant()).toBe(true);
  });

  test("classifies a vertex correctly", function () {
    s.dcel.getVertices()[0].edges.push(s.directions.od104, s.directions.od37);
    expect(isSignificant()).toBe(true);
  });

  test("classifies a vertex with edges in disjoint sectors as not significant.", function () {
    s.dcel.getVertices()[0].edges.push(s.directions.od217, s.directions.od37);
    expect(isSignificant()).toBe(false);
  });
});

describe("the sector of edges incident to a vertex are correctly identified", function () {
  let s: TestSetup;
  let c: C;
  beforeEach(function () {
    s = createEdgeVertexSetup();
    ({ c } = style);
  });

  test("using getAssociatedSector() for C2", function () {
    expect(getAssociatedSector(s.directions.od0, c.sectors)).toEqual([
      new CRegular(2).getSector(0) as Sector,
      new CRegular(2).getSector(3) as Sector,
    ]);
    expect(getAssociatedSector(s.directions.od90, c.sectors)).toEqual([
      new CRegular(2).getSector(0) as Sector,
      new CRegular(2).getSector(1) as Sector,
    ]);
    expect(getAssociatedSector(s.directions.od180, c.sectors)).toEqual([
      new CRegular(2).getSector(1) as Sector,
      new CRegular(2).getSector(2) as Sector,
    ]);
    expect(getAssociatedSector(s.directions.od270, c.sectors)).toEqual([
      new CRegular(2).getSector(2) as Sector,
      new CRegular(2).getSector(3) as Sector,
    ]);
  });

  test("using getAssociatedSector() for C4", function () {
    const sectors = new CRegular(4).sectors;
    expect(getAssociatedSector(s.directions.od0, sectors)).toEqual([
      new CRegular(4).getSector(0) as Sector,
      new CRegular(4).getSector(7) as Sector,
    ]);
    expect(getAssociatedSector(s.directions.od90, sectors)).toEqual([
      new CRegular(4).getSector(1) as Sector,
      new CRegular(4).getSector(2) as Sector,
    ]);
    expect(getAssociatedSector(s.directions.od180, sectors)).toEqual([
      new CRegular(4).getSector(3) as Sector,
      new CRegular(4).getSector(4) as Sector,
    ]);
    expect(getAssociatedSector(s.directions.od270, sectors)).toEqual([
      new CRegular(4).getSector(5) as Sector,
      new CRegular(4).getSector(6) as Sector,
    ]);
  });

  test("using getAssociatedAngles() for C2", function () {
    expect(getAssociatedAngles(s.directions.od0, c.sectors)).toEqual([0]);
    expect(getAssociatedAngles(s.directions.od90, c.sectors)).toEqual([
      Math.PI * 0.5,
    ]);
    expect(getAssociatedAngles(s.directions.od180, c.sectors)).toEqual([
      Math.PI,
    ]);
    expect(getAssociatedAngles(s.directions.od270, c.sectors)).toEqual([
      Math.PI * 1.5,
    ]);
    expect(getAssociatedAngles(s.directions.od37, c.sectors)).toEqual([
      0,
      Math.PI * 0.5,
    ]);
    expect(getAssociatedAngles(s.directions.od284, c.sectors)).toEqual([
      Math.PI * 1.5,
      TWO_PI,
    ]);
  });

  test("using getAssociatedAngles() for C4", function () {
    expect(
      getAssociatedAngles(s.directions.od0, new CRegular(4).sectors),
    ).toEqual([0]);
    expect(
      getAssociatedAngles(s.directions.od90, new CRegular(4).sectors),
    ).toEqual([Math.PI * 0.5]);
    expect(
      getAssociatedAngles(s.directions.od180, new CRegular(4).sectors),
    ).toEqual([Math.PI]);
    expect(
      getAssociatedAngles(s.directions.od270, new CRegular(4).sectors),
    ).toEqual([Math.PI * 1.5]);
    expect(
      getAssociatedAngles(s.directions.od37, new CRegular(4).sectors),
    ).toEqual([0, Math.PI * 0.25]);
    expect(
      getAssociatedAngles(s.directions.od284, new CRegular(4).sectors),
    ).toEqual([Math.PI * 1.5, Math.PI * 1.75]);
  });
});

describe("crawlArray()", function () {
  let arr: (string | number)[] = [];
  beforeEach(function () {
    arr = ["first", "second", 2, 3, 4, 5, "secondlast", "last"];
  });

  test("crawls forward +2", function () {
    expect(crawlArray(arr, 6, +2)).toBe("first");
  });

  test("crawls forward +1", function () {
    expect(crawlArray(arr, 7, +1)).toBe("first");
  });

  test("crawls backward -1", function () {
    expect(crawlArray(arr, 0, -1)).toBe("last");
  });

  test("crawls backward -2", function () {
    expect(crawlArray(arr, 0, -2)).toBe("secondlast");
  });
});

describe("The sectors of a C shifted by a beta", function () {
  const beta = degreesToRadians(5);

  test.each([2, 3, 4, 6])(
    "cover the whole circle for C(%i)",
    function (orientations) {
      const sectors = new CRegular(orientations, beta).sectors;

      // Each sector picks up where the one before it left off, the last one reaching
      // around to where the first one starts.
      sectors.forEach((sector, index) => {
        const next = sectors[(index + 1) % sectors.length];
        const start =
          index + 1 === sectors.length ? next.lower + TWO_PI : next.lower;
        expect(sector.upper).toBeCloseTo(start, DECIMAL_SCALE);
      });
    },
  );

  test.each([2, 3, 4, 6])(
    "enclose an angle between zero and beta for C(%i)",
    function (orientations) {
      const sectors = new CRegular(orientations, beta).sectors;
      const angle = beta / 2;

      // Only the last sector reaches around past 2π to cover it.
      expect(sectors.filter((sector) => sector.encloses(angle))).toEqual([
        sectors[sectors.length - 1],
      ]);
    },
  );

  test("associate an edge along zero with the sector reaching around to it", function () {
    const c = new CRegular(2, beta);
    const dcel = new Dcel();
    const [tail, head] = [dcel.addVertex(0, 0), dcel.addVertex(1, 0)];
    const edge = dcel.addHalfEdge(tail, head);
    edge.twin = dcel.addHalfEdge(head, tail);

    // Without the last sector reaching around, an edge along zero belongs to no
    // sector at all, which leaves its staircase without a region.
    expect(getAssociatedAngles(edge, c.sectors).length).toBeGreaterThan(0);
    expect(getAssociatedSector(edge, c.sectors)).toEqual([
      c.sectors[c.sectors.length - 1],
    ]);
  });
});
