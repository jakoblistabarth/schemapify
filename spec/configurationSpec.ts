import fs from "fs";
import path from "path";
import Point from "../src/lib/geometry/Point";
import Configuration, {
  Contraction,
  OuterEdge,
} from "../src/lib/c-oriented-schematization/Configuration";
import Dcel from "../src/lib/DCEL/Dcel";
import { configurationCases, ConfigurationSetup, createConfigurationSetup } from "./test-setup";

describe("getTrack()", function () {
  it("return the correct angles for the reflex point for a square shape", function () {
    const json = JSON.parse(fs.readFileSync(path.resolve("data/shapes/square.json"), "utf8"));
    const dcel = Dcel.fromGeoJSON(json);

    const outerEdge1 = dcel.getBoundedFaces()[0].edge;
    outerEdge1.configuration = new Configuration(outerEdge1);
    const outerEdge2 = outerEdge1.next;
    outerEdge2.configuration = new Configuration(outerEdge2);

    expect(outerEdge1.configuration.getTrack(OuterEdge.PREV).angle).toBe(Math.PI * 1.5);
    expect(outerEdge1.configuration.getTrack(OuterEdge.NEXT).angle).toBe(Math.PI * 0.5);
    expect(outerEdge2.configuration.getTrack(OuterEdge.PREV).angle).toBe(Math.PI * 0);
    expect(outerEdge2.configuration.getTrack(OuterEdge.NEXT).angle).toBe(Math.PI);
  });
});

describe("getX() for a configuration", function () {
  it("returns 3 edges, forming the configuration.", function () {
    const s = configurationCases.bothNoBlockingPoint;

    s.innerEdge.configuration = new Configuration(s.innerEdge);
    const x = s.innerEdge.configuration.getX();

    expect(x.length).toBe(3);
    expect(x).toEqual([s.edges[0], s.edges[1], s.edges[2]]);
  });
});

describe("getContractionPoint() for a configuration", function () {
  it("where one intersection Point lies on an edge of the boundary which is not part of the configuration, returns 2 intersection point", function () {
    const s = configurationCases.bothNoBlockingPoint;

    s.innerEdge.configuration = new Configuration(s.innerEdge);
    const points = s.innerEdge.configuration.getContractionPoints();

    expect(points[Contraction.NEG]).toEqual(new Point(-4, 4));
    expect(points[Contraction.POS]).toEqual(new Point(1, -2));
  });

  it("where the innerEdge is reflex, returns 1 (positive) intersection point", function () {
    const s = configurationCases.posReflex;

    s.innerEdge.configuration = new Configuration(s.innerEdge);
    const points = s.innerEdge.configuration.getContractionPoints();

    expect(points[Contraction.NEG]).toBeUndefined();
    expect(points[Contraction.POS]).toEqual(new Point(-4, 0));
  });

  it("where the innerEdge is convex, returns 1 (negative) intersection point.", function () {
    const s = configurationCases.negConvex;

    s.innerEdge.configuration = new Configuration(s.innerEdge);
    const points = s.innerEdge.configuration.getContractionPoints();

    expect(points[Contraction.NEG]).toEqual(new Point(4, 2));
    expect(points[Contraction.POS]).toBeUndefined();
  });

  it("where the negative contraction is not feasible (a point of ∂PX is in the contraction area), still returns 2 intersection points.", function () {
    const s = configurationCases.bothBlockingPointNeg;

    s.innerEdge.configuration = new Configuration(s.innerEdge);
    const points = s.innerEdge.configuration.getContractionPoints();

    expect(points[Contraction.NEG]).toEqual(new Point(-4, 4));
    expect(points[Contraction.POS]).toEqual(new Point(1, -2));
  });

  it("where one intersection Point lies on an edge of the boundary which is not part of the configuration, returns 2 intersection points.", function () {
    const s = createConfigurationSetup(
      new Point(-4, 4),
      new Point(0, 0),
      new Point(2, 0),
      new Point(0, -2),
      [new Point(8, 4)]
    );

    s.innerEdge.configuration = new Configuration(s.innerEdge);
    const points = s.innerEdge.configuration.getContractionPoints();

    expect(points[Contraction.NEG]).toEqual(new Point(-4, 4));
    expect(points[Contraction.POS]).toEqual(new Point(1, -1));
  });

  it(" returns 2 contraction points, when one tracks intersects the configuration's first edge,", function () {
    const s = createConfigurationSetup(
      new Point(-2, 2),
      new Point(-2, 0),
      new Point(2, 0),
      new Point(8, -2),
      [new Point(4, 4)]
    );
    s.innerEdge.configuration = new Configuration(s.innerEdge);
    const points = s.innerEdge.configuration.getContractionPoints();

    expect(points[Contraction.POS]).toEqual(new Point(8, -2));
    expect(points[Contraction.NEG]).toEqual(new Point(-2, 1.3333333333));
  });

  it("returns 2 contraction points, when one track intersects the configuration's second edge.", function () {
    const s = createConfigurationSetup(
      new Point(-8, -2),
      new Point(-2, 0),
      new Point(2, 0),
      new Point(2, 2),
      [new Point(-4, 4)]
    );
    s.innerEdge.configuration = new Configuration(s.innerEdge);
    const points = s.innerEdge.configuration.getContractionPoints();

    expect(points[Contraction.POS]).toEqual(new Point(-8, -2));
    expect(points[Contraction.NEG]).toEqual(new Point(2, 1.3333333333));
  });

  it("returns 2 contraction points, when the edge is of inflection type both and the tracks are parallel.", function () {
    const s = configurationCases.bothParallelTracks;
    s.innerEdge.configuration = new Configuration(s.innerEdge);
    const points = s.innerEdge.configuration.getContractionPoints();

    expect(points[Contraction.POS]).toEqual(new Point(2, -2));
    expect(points[Contraction.NEG]).toEqual(new Point(-2, 2));
  });

  it("where the edge is convex and the tracks are parallel, returns 1 contractionPoint.", function () {
    const s = configurationCases.negConvexParallelTracks;

    s.innerEdge.configuration = new Configuration(s.innerEdge);
    const points = s.innerEdge.configuration.getContractionPoints();

    expect(points[Contraction.NEG]).toEqual(new Point(2, 2));
    expect(points[Contraction.POS]).toBeUndefined();
  });
});

describe("getContractionAreaPoints() returns the correct contraction area", function () {
  let s: ConfigurationSetup;
  beforeEach(function () {
    s = configurationCases.bothBlockingPointNeg;
  });

  it("given a negative contraction Point.", function () {
    s.innerEdge.configuration = new Configuration(s.innerEdge);
    const area = s.innerEdge.configuration.getContractionAreaPoints(Contraction.NEG);
    expect(area.map((point) => point.xy())).toEqual([
      [-4, 4],
      [-2, 0],
      [2, 0],
      [4, 4],
    ]);
  });

  it("given a positive contraction Point.", function () {
    s.innerEdge.configuration = new Configuration(s.innerEdge);
    const area = s.innerEdge.configuration.getContractionAreaPoints(Contraction.POS);
    expect(area.map((point) => point.xy())).toEqual([
      [1, -2],
      [2, 0],
      [-2, 0],
      [-1, -2],
    ]);
  });
});

describe("getX() and getX_() returns the correct number of boundary edges", function () {
  it("for a setup with one interference.", function () {
    const s = configurationCases.bothBlockingPointNeg;
    const c = new Configuration(s.innerEdge);

    expect(c.getX().length).toBe(3);
    expect(s.edges.length - c.getX_().length).toEqual(c.getX().length);
  });
});

describe("getBlockingNumbers() returns interfering edges", function () {
  it("for a setup with one interference (partially residing).", function () {
    const s = configurationCases.bothBlockingPointNeg;
    const c = new Configuration(s.innerEdge);
    c.BlockingNumbers[Contraction.NEG] = c.setBlockingNumber(Contraction.NEG);
    c.BlockingNumbers[Contraction.POS] = c.setBlockingNumber(Contraction.POS);

    expect(c.BlockingNumbers[Contraction.NEG].length).toBe(1);
    expect(c.BlockingNumbers[Contraction.NEG]).toEqual(s.edges.slice(-1));
    expect(c.BlockingNumbers[Contraction.POS].length).toBe(0);
  });

  it("for a setup with one interference (partially and entirely residing)", function () {
    const s = createConfigurationSetup(
      new Point(-4, 4),
      new Point(-2, 0),
      new Point(2, 0),
      new Point(1, -2),
      [new Point(6, 2), new Point(1, 1), new Point(-1, 1)]
    );

    const c = new Configuration(s.innerEdge);
    c.BlockingNumbers[Contraction.NEG] = c.setBlockingNumber(Contraction.NEG);
    c.BlockingNumbers[Contraction.POS] = c.setBlockingNumber(Contraction.POS);

    expect(c.BlockingNumbers[Contraction.NEG].length).toBe(3);
    expect(c.BlockingNumbers[Contraction.NEG]).toEqual(s.edges.slice(-3));
    expect(c.BlockingNumbers[Contraction.POS].length).toBe(0);
  });

  it("for a setup with one interference (partially and entirely residing)", function () {
    const s = createConfigurationSetup(
      new Point(-4, 4),
      new Point(-2, 0),
      new Point(2, 0),
      new Point(1, -2),
      [
        new Point(2, -2),
        new Point(0, -3),
        new Point(0, -1),
        new Point(-2, -4),
        new Point(6, -4),
        new Point(6, 2),
        new Point(1, 1),
        new Point(-1, 1),
      ]
    );
    const c = new Configuration(s.innerEdge);
    c.BlockingNumbers[Contraction.NEG] = c.setBlockingNumber(Contraction.NEG);
    c.BlockingNumbers[Contraction.POS] = c.setBlockingNumber(Contraction.POS);

    expect(c.BlockingNumbers[Contraction.NEG].length).toBe(3);
    expect(c.BlockingNumbers[Contraction.NEG]).toEqual(s.edges.slice(-3));
    expect(c.BlockingNumbers[Contraction.POS].length).toBe(2);
    expect(c.BlockingNumbers[Contraction.POS]).toEqual(s.edges.slice(5, 7));
  });
});

describe("isFeasible() returns", function () {
  it("true for a contraction with a contraction point and a blockingnumber of 0, and false if the blocking number is > 0.", function () {
    const s = configurationCases.bothBlockingPointNeg;

    const c = new Configuration(s.innerEdge);
    c.BlockingNumbers[Contraction.POS] = c.setBlockingNumber(Contraction.POS);
    c.BlockingNumbers[Contraction.NEG] = c.setBlockingNumber(Contraction.NEG);

    expect(c.isFeasible(Contraction.POS)).toBeTrue();
    expect(c.isFeasible(Contraction.NEG)).toBeFalse();
  });

  it("false for a contraction which has no contraction point of the specified contraction type", function () {
    const s = configurationCases.negConvex;

    const c = new Configuration(s.innerEdge);
    c.BlockingNumbers[Contraction.POS] = c.setBlockingNumber(Contraction.POS);

    expect(c.isFeasible(Contraction.POS)).toBeFalse();
  });
});

describe("getContractionArea() returns", function () {
  it("the Area of an contraction area", function () {
    const s = configurationCases.bothBlockingPointNeg;
    const c = new Configuration(s.innerEdge);
    const areaPos = c.getContractionArea(Contraction.POS);
    const areaNeg = c.getContractionArea(Contraction.NEG);

    expect(areaPos).toBe(6);
    expect(areaNeg).toBe(24);
  });
});
