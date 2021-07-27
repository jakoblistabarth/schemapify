import fs from "fs";
import path from "path";
import HalfEdge from "src/lib/DCEL/HalfEdge";
import Configuration, { OuterEdge } from "../src/lib/c-oriented-schematization/Configuration";
import Contraction, { ContractionType } from "../src/lib/c-oriented-schematization/Contraction";
import Dcel from "../src/lib/DCEL/Dcel";
import Point from "../src/lib/geometry/Point";
import { configurationCases, ConfigurationSetup, createConfigurationSetup } from "./test-setup";

describe("getTrack()", function () {
  it("return the correct angles for the reflex point for a square shape", function () {
    const json = JSON.parse(fs.readFileSync(path.resolve("data/shapes/square.json"), "utf8"));
    const dcel = Dcel.fromGeoJSON(json);

    const outerEdge1 = dcel.getBoundedFaces()[0].edge as HalfEdge; //TODO: check if casting is a good way of handle these kind of type issues
    const outerEdge2 = outerEdge1?.next as HalfEdge;
    outerEdge1.configuration = new Configuration(outerEdge1);
    outerEdge2.configuration = new Configuration(outerEdge2);

    expect(outerEdge1?.configuration.getTrack(OuterEdge.PREV)?.angle).toBe(Math.PI * 1.5);
    expect(outerEdge1?.configuration.getTrack(OuterEdge.NEXT)?.angle).toBe(Math.PI * 0.5);
    expect(outerEdge2?.configuration.getTrack(OuterEdge.PREV)?.angle).toBe(Math.PI * 0);
    expect(outerEdge2?.configuration.getTrack(OuterEdge.NEXT)?.angle).toBe(Math.PI);
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

    const c = (s.innerEdge.configuration = new Configuration(s.innerEdge));

    expect(c[ContractionType.N]?.point).toEqual(new Point(-4, 4));
    expect(c[ContractionType.P]?.point).toEqual(new Point(1, -2));
  });

  it("where the innerEdge is reflex, returns 1 (positive) intersection point", function () {
    const s = configurationCases.posReflex;

    const c = (s.innerEdge.configuration = new Configuration(s.innerEdge));

    expect(c[ContractionType.N]).toBeUndefined();
    expect(c[ContractionType.P]?.point).toEqual(new Point(-4, 0));
  });

  it("where the innerEdge is convex, returns 1 (negative) intersection point.", function () {
    const s = configurationCases.negConvex;

    const c = (s.innerEdge.configuration = new Configuration(s.innerEdge));

    expect(c[ContractionType.N]?.point).toEqual(new Point(4, 2));
    expect(c[ContractionType.P]).toBeUndefined();
  });

  it("where the negative contraction is not feasible (a point of ∂PX is in the contraction area), still returns 2 intersection points.", function () {
    const s = configurationCases.bothBlockingPointNeg;

    const c = (s.innerEdge.configuration = new Configuration(s.innerEdge));

    expect(c[ContractionType.N]?.point).toEqual(new Point(-4, 4));
    expect(c[ContractionType.P]?.point).toEqual(new Point(1, -2));
  });

  it("where one intersection Point lies on an edge of the boundary which is not part of the configuration, returns 2 intersection points.", function () {
    const s = createConfigurationSetup(
      new Point(-4, 4),
      new Point(0, 0),
      new Point(2, 0),
      new Point(0, -2),
      [new Point(8, 4)]
    );

    const c = (s.innerEdge.configuration = new Configuration(s.innerEdge));

    expect(c[ContractionType.N]?.point).toEqual(new Point(-4, 4));
    expect(c[ContractionType.P]?.point).toEqual(new Point(1, -1));
  });

  it(" returns 2 contraction points, when one tracks intersects the configuration's first edge,", function () {
    const s = configurationCases.bothContractionOnFirstEdge;

    const c = (s.innerEdge.configuration = new Configuration(s.innerEdge));

    expect(c[ContractionType.P]?.point).toEqual(new Point(8, -2));
    expect(c[ContractionType.N]?.point).toEqual(new Point(-2, 1.3333333333));
  });

  it("returns 2 contraction points, when one track intersects the configuration's third edge.", function () {
    const s = configurationCases.bothContractionOnThirdEdge;

    const c = (s.innerEdge.configuration = new Configuration(s.innerEdge));

    expect(c[ContractionType.P]?.point).toEqual(new Point(-8, -2));
    expect(c[ContractionType.N]?.point).toEqual(new Point(2, 1.3333333333));
  });

  it("returns 2 contraction points, when the edge is of inflection type both and the tracks are parallel.", function () {
    const s = configurationCases.bothParallelTracks;

    const c = (s.innerEdge.configuration = new Configuration(s.innerEdge));

    expect(c[ContractionType.P]?.point).toEqual(new Point(2, -2));
    expect(c[ContractionType.N]?.point).toEqual(new Point(-2, 2));
  });

  it("where the edge is convex and the tracks are parallel, returns 1 contractionPoint.", function () {
    const s = configurationCases.negConvexParallelTracks;

    const c = (s.innerEdge.configuration = new Configuration(s.innerEdge));

    expect(c[ContractionType.N]?.point).toEqual(new Point(2, 2));
    expect(c[ContractionType.P]).toBeUndefined();
  });
});

describe("getContractionAreaPoints() returns the correct contraction area", function () {
  it("given a negative contraction point.", function () {
    const s = configurationCases.bothBlockingPointNeg;
    const c = (s.innerEdge.configuration = new Configuration(s.innerEdge));
    const areaPoints = c[ContractionType.N]?.getAreaPoints();
    expect(areaPoints?.map((p) => p.xy())).toEqual([
      [-4, 4],
      [-2, 0],
      [2, 0],
      [4, 4],
    ]);
  });

  it("given a positive contraction point.", function () {
    const s = configurationCases.bothBlockingPointNeg;
    const c = (s.innerEdge.configuration = new Configuration(s.innerEdge));
    const areaPoints = c[ContractionType.P]?.getAreaPoints();
    expect(areaPoints?.map((p) => p.xy())).toEqual([
      [1, -2],
      [2, 0],
      [-2, 0],
      [-1, -2],
    ]);
  });

  it("given a negative contraction point on the configuration's first edge.", function () {
    const s = configurationCases.bothContractionOnFirstEdge;
    const c = (s.innerEdge.configuration = new Configuration(s.innerEdge));
    const areaPoints = c[ContractionType.N]?.getAreaPoints();

    expect(areaPoints?.map((p) => p.xy())).toEqual([
      [-2, 1.3333333333],
      [-2, 0],
      [2, 0],
    ]);
  });

  it("given a negative contraction point on the configuration's third edge.", function () {
    const s = configurationCases.bothContractionOnThirdEdge;
    const c = (s.innerEdge.configuration = new Configuration(s.innerEdge));
    const areaPoints = c[ContractionType.N]?.getAreaPoints();

    expect(areaPoints?.map((p) => p.xy())).toEqual([
      [2, 1.3333333333],
      [2, 0],
      [-2, 0],
    ]);
  });
});

describe("getX() and getX_() returns the correct number of boundary edges", function () {
  it("for a setup with one interference.", function () {
    const s = configurationCases.bothBlockingPointNeg;
    const c = new Configuration(s.innerEdge);

    expect(c.getX()?.length).toBe(3);
    expect(s.edges.length - c.getX_().length).toEqual(c.getX().length);
  });
});

describe("setBlockingEdges() returns interfering edges", function () {
  it("for a setup with one interference (partially residing).", function () {
    const s = configurationCases.bothBlockingPointNeg;
    const c = new Configuration(s.innerEdge);

    expect(c[ContractionType.N]?.blockingEdges.length).toBe(1);
    expect(c[ContractionType.N]?.blockingEdges).toEqual(s.edges.slice(-1));
    expect(c[ContractionType.P]?.blockingEdges.length).toBe(0);
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

    expect(c[ContractionType.N]?.blockingEdges.length).toBe(3);
    expect(c[ContractionType.N]?.blockingEdges).toEqual(s.edges.slice(-3));
    expect(c[ContractionType.P]?.blockingEdges.length).toBe(0);
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

    expect(c[ContractionType.N]?.blockingEdges.length).toBe(3);
    expect(c[ContractionType.N]?.blockingEdges).toEqual(s.edges.slice(-3));
    expect(c[ContractionType.P]?.blockingEdges.length).toBe(2);
    expect(c[ContractionType.P]?.blockingEdges).toEqual(s.edges.slice(5, 7));
  });
});

describe("isFeasible() returns", function () {
  it("true for a contraction with a contraction point and a blockingnumber of 0, and false if the blocking number is > 0.", function () {
    const s = configurationCases.bothBlockingPointNeg;

    const c = new Configuration(s.innerEdge);

    expect(c[ContractionType.N]?.isFeasible()).toBeFalse();
    expect(c[ContractionType.P]?.isFeasible()).toBeTrue();
  });
});

describe("getContractionArea() returns", function () {
  it("the Area of an contraction area.", function () {
    const s = configurationCases.bothBlockingPointNeg;
    const c = new Configuration(s.innerEdge);

    expect(c[ContractionType.P]?.area).toBe(6);
    expect(c[ContractionType.N]?.area).toBe(24);
  });

  it("the area of an contraction area for a collinear configuration.", function () {
    const s = createConfigurationSetup(
      new Point(-4, 0),
      new Point(-2, 0),
      new Point(2, 0),
      new Point(4, 0),
      [new Point(4, 4), new Point(-4, 4)]
    );
    const c = (s.innerEdge.configuration = new Configuration(s.innerEdge));

    expect(c[ContractionType.N]?.area).toEqual(0);
    expect(c[ContractionType.P]?.area).toEqual(0);
  });
});

describe("is Complementary() returns", function () {
  let s: ConfigurationSetup;
  let c: Configuration;
  let pos: Contraction;
  let neg: Contraction;
  beforeEach(function () {
    s = configurationCases.bothNoBlockingPoint;
    c = new Configuration(s.innerEdge);
    pos = c[ContractionType.P] as Contraction;
    neg = c[ContractionType.N] as Contraction;
  });

  it("true, when the configuration has a contraction point of the complementary contraction type.", function () {
    expect(neg.isComplementary(pos)).toBeTrue();
    expect(pos.isComplementary(neg)).toBeTrue();
  });

  it("false, when the configuration has no contraction point of the complementary contraction type.", function () {
    expect(pos.isComplementary(pos)).toBeFalse();
    expect(neg.isComplementary(neg)).toBeFalse();
  });
});
