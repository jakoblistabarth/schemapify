import fs from "fs";
import path from "path";
import HalfEdge from "@/src/Dcel/HalfEdge";
import Configuration, {
  OuterEdge,
  Junction,
} from "@/src/c-oriented-schematization/Configuration";
import Contraction from "@/src/c-oriented-schematization/Contraction";
import Dcel from "@/src/Dcel/Dcel";
import Point from "@/src/geometry/Point";
import Vertex from "@/src/Dcel/Vertex";
import {
  configurationCases,
  ConfigurationSetup,
  createConfigurationSetup,
} from "./test-setup";
import { ContractionType } from "@/src/c-oriented-schematization/ContractionType";

describe("getTrack()", function () {
  it("return the correct angles for the reflex point for a square shape", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/square.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);

    const outerEdge1 = dcel.getBoundedFaces()[0].edge as HalfEdge; //TODO: check if casting is a good way of handle these kind of type issues
    const outerEdge2 = outerEdge1?.next as HalfEdge;
    outerEdge1.configuration = new Configuration(outerEdge1);
    outerEdge2.configuration = new Configuration(outerEdge2);

    expect(outerEdge1?.configuration.getTrack(OuterEdge.PREV)?.angle).toBe(
      Math.PI * 1.5,
    );
    expect(outerEdge1?.configuration.getTrack(OuterEdge.NEXT)?.angle).toBe(
      Math.PI * 0.5,
    );
    expect(outerEdge2?.configuration.getTrack(OuterEdge.PREV)?.angle).toBe(
      Math.PI * 0,
    );
    expect(outerEdge2?.configuration.getTrack(OuterEdge.NEXT)?.angle).toBe(
      Math.PI,
    );
  });
});

describe("getX() for a configuration", function () {
  it("returns 3 edges, forming the configuration.", function () {
    const s = configurationCases.bothNoBlockingPoint;

    s.innerEdge.configuration = new Configuration(s.innerEdge);
    const x = s.innerEdge.configuration.x;

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
      [new Point(8, 4)],
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
    const areaPoints = c[ContractionType.N]?.areaPoints;
    expect(areaPoints?.map((p) => p.xy)).toEqual([
      [-4, 4],
      [-2, 0],
      [2, 0],
      [4, 4],
    ]);
  });

  it("given a positive contraction point.", function () {
    const s = configurationCases.bothBlockingPointNeg;
    const c = (s.innerEdge.configuration = new Configuration(s.innerEdge));
    const areaPoints = c[ContractionType.P]?.areaPoints;
    expect(areaPoints?.map((p) => p.xy)).toEqual([
      [1, -2],
      [2, 0],
      [-2, 0],
      [-1, -2],
    ]);
  });

  it("given a negative contraction point on the configuration's first edge.", function () {
    const s = configurationCases.bothContractionOnFirstEdge;
    const c = (s.innerEdge.configuration = new Configuration(s.innerEdge));
    const areaPoints = c[ContractionType.N]?.areaPoints;

    expect(areaPoints?.map((p) => p.xy)).toEqual([
      [-2, 1.3333333333],
      [-2, 0],
      [2, 0],
    ]);
  });

  it("given a negative contraction point on the configuration's third edge.", function () {
    const s = configurationCases.bothContractionOnThirdEdge;
    const c = (s.innerEdge.configuration = new Configuration(s.innerEdge));
    const areaPoints = c[ContractionType.N]?.areaPoints;

    expect(areaPoints?.map((p) => p.xy)).toEqual([
      [2, 1.3333333333],
      [2, 0],
      [-2, 0],
    ]);
  });
});

describe("x and x_ return the correct number of boundary edges", function () {
  it("for a setup with one interference.", function () {
    const s = configurationCases.bothBlockingPointNeg;
    const c = new Configuration(s.innerEdge);

    expect(c.x.length).toBe(3);
    expect(s.edges.length - c.x_.length).toEqual(c.x.length);
  });
});

describe("isBlockedBy() determines whether or not a contraction is blocked by an edge", function () {
  it("for a negative contraction", function () {
    const s = createConfigurationSetup(
      new Point(-4, 2),
      new Point(-2, 0),
      new Point(2, 0),
      new Point(4, 2),
      [new Point(0, 6), new Point(0, 1)],
    );
    const c = new Configuration(s.innerEdge);

    expect(c[ContractionType.N]?.isBlockedBy(s.edges[0])).toBe(false);
    expect(c[ContractionType.N]?.isBlockedBy(s.edges[1])).toBe(false);
    expect(c[ContractionType.N]?.isBlockedBy(s.edges[2])).toBe(false);
    expect(c[ContractionType.N]?.isBlockedBy(s.edges[3])).toBe(false);
    expect(c[ContractionType.N]?.isBlockedBy(s.edges[4])).toBe(true);
  });

  it("for a positive contraction", function () {
    const s = createConfigurationSetup(
      new Point(-4, 0),
      new Point(-2, 2),
      new Point(2, 2),
      new Point(4, 0),
      [new Point(0, 1), new Point(5, -2), new Point(5, 4), new Point(-4, 4)],
    );
    const c = new Configuration(s.innerEdge);

    expect(c[ContractionType.P]?.isBlockedBy(s.edges[0])).toBe(false);
    expect(c[ContractionType.P]?.isBlockedBy(s.edges[1])).toBe(false);
    expect(c[ContractionType.P]?.isBlockedBy(s.edges[2])).toBe(false);
    expect(c[ContractionType.P]?.isBlockedBy(s.edges[3])).toBe(true);
    expect(c[ContractionType.P]?.isBlockedBy(s.edges[4])).toBe(true);
    expect(c[ContractionType.P]?.isBlockedBy(s.edges[5])).toBe(false);
    expect(c[ContractionType.P]?.isBlockedBy(s.edges[6])).toBe(false);
    expect(c[ContractionType.P]?.isBlockedBy(s.edges[7])).toBe(false);
  });

  it("and handles edges which are part of X correctly", function () {
    const s = createConfigurationSetup(
      new Point(-4, 0),
      new Point(-2, 2),
      new Point(2, 2),
      new Point(4, 0),
      [new Point(0, 1), new Point(5, -2), new Point(5, 4), new Point(-4, 4)],
    );
    const c = new Configuration(s.innerEdge);

    expect(c[ContractionType.P]?.isBlockedBy(s.edges[0])).toBe(false);
    expect(c[ContractionType.P]?.isBlockedBy(s.edges[1])).toBe(false);
    expect(c[ContractionType.P]?.isBlockedBy(s.edges[2])).toBe(false);
  });
});

describe("initializeBlockingNumber() returns the number of interfering edges", function () {
  it("for a setup with one interference (partially residing).", function () {
    const s = configurationCases.bothBlockingPointNeg;
    const c = new Configuration(s.innerEdge);

    expect(c[ContractionType.N]?.blockingNumber).toBe(1);
    expect(c[ContractionType.P]?.blockingNumber).toBe(0);
  });

  it("for a setup with 3 interferences (partially and entirely residing)", function () {
    const s = createConfigurationSetup(
      new Point(-4, 4),
      new Point(-2, 0),
      new Point(2, 0),
      new Point(1, -2),
      [new Point(6, 2), new Point(1, 1), new Point(-1, 1)],
    );

    const c = new Configuration(s.innerEdge);

    expect(c[ContractionType.N]?.blockingNumber).toBe(3);
    expect(c[ContractionType.P]?.blockingNumber).toBe(0);
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
      ],
    );
    const c = new Configuration(s.innerEdge);

    expect(c[ContractionType.N]?.blockingNumber).toBe(3);
    expect(c[ContractionType.P]?.blockingNumber).toBe(2);
  });

  it("for a rectilinear setup", function () {
    const s = createConfigurationSetup(
      new Point(11, 0),
      new Point(11, 1),
      new Point(10, 1),
      new Point(10, 7),
      [new Point(0, 7), new Point(0, 0)],
    );
    const c = new Configuration(s.innerEdge);

    expect(c[ContractionType.N]?.blockingNumber).toBe(1);
    expect(c[ContractionType.P]?.blockingNumber).toBe(0);
  });
});

describe("The getter isFeasible returns", function () {
  it("true for a contraction with a contraction point and a blockingnumber of 0, and false if the blocking number is > 0.", function () {
    const s = configurationCases.bothBlockingPointNeg;

    const c = new Configuration(s.innerEdge);

    expect(c[ContractionType.N]?.isFeasible).toBe(false);
    expect(c[ContractionType.P]?.isFeasible).toBe(true);
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
      [new Point(4, 4), new Point(-4, 4)],
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
    expect(neg.isComplementary(pos)).toBe(true);
    expect(pos.isComplementary(neg)).toBe(true);
  });

  it("false, when the configuration has no contraction point of the complementary contraction type.", function () {
    expect(pos.isComplementary(pos)).toBe(false);
    expect(neg.isComplementary(neg)).toBe(false);
  });
});

describe("getJunctionType() determines the type of a junction in respect to the inneredge", function () {
  let dcel: Dcel;
  beforeEach(function () {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/edge-move-test.json"),
        "utf8",
      ),
    );
    dcel = Dcel.fromGeoJSON(json);
  });

  it("for a junction of type A.", function () {
    const edge = dcel.getHalfEdges()[2];
    const c = new Configuration(edge);
    const junction = dcel.findVertex(2, 0) as Vertex;

    expect(c.getJunctionType(junction)).toBe(Junction.A);
  });

  it("for a junction of type B.", function () {
    const edge = dcel.getHalfEdges()[6];
    const c = new Configuration(edge);
    const junction = dcel.findVertex(1, 2) as Vertex;

    expect(c.getJunctionType(junction)).toBe(Junction.B);
  });

  it("for a configuration with junctions of type A and C.", function () {
    const edge = dcel.getHalfEdges()[14];
    const c = new Configuration(edge);
    const junction = dcel.findVertex(3, 2) as Vertex;
    const junction2 = dcel.findVertex(3, 0) as Vertex;

    expect(c.getJunctionType(junction)).toBe(Junction.C);
    expect(c.getJunctionType(junction2)).toBe(Junction.A);
  });
});
