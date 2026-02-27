import Configuration, {
  Junction,
  OuterEdge,
} from "@/src/c-oriented-schematization/Configuration";
import ConfigurationGenerator from "@/src/c-oriented-schematization/ConfigurationGenerator";
import Contraction from "@/src/c-oriented-schematization/Contraction";
import { ContractionType } from "@/src/c-oriented-schematization/ContractionType";
import Dcel from "@/src/Dcel/Dcel";
import Point from "@/src/geometry/Point";
import fs from "fs";
import path from "path";
import { beforeEach, describe, expect, test } from "vitest";
import {
  configurationCases,
  ConfigurationSetup,
  createConfigurationSetup,
  idOr,
} from "./test-setup";

describe("getTrack()", function () {
  test("return the correct angles for the reflex point for a square shape", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/square.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);
    const configurations = new ConfigurationGenerator().run(dcel);

    const outerEdgeA = dcel.getBoundedFaces()[0].edge;
    const outerEdgeB = outerEdgeA?.next;
    if (!outerEdgeB) {
      throw new Error("Outer edge is undefined.");
    }
    const configurationA = configurations.get(idOr(outerEdgeA));
    const configurationB = configurations.get(idOr(outerEdgeB));

    expect(configurationA?.getTrack(OuterEdge.PREV)?.angle).toBe(Math.PI * 1.5);
    expect(configurationA?.getTrack(OuterEdge.NEXT)?.angle).toBe(Math.PI * 0.5);
    expect(configurationB?.getTrack(OuterEdge.PREV)?.angle).toBe(Math.PI * 0);
    expect(configurationB?.getTrack(OuterEdge.NEXT)?.angle).toBe(Math.PI);
  });
});

describe("getX() for a configuration", function () {
  test("returns 3 edges, forming the configuration.", function () {
    const s = configurationCases.bothNoBlockingPoint;
    const configurations = new ConfigurationGenerator().run(s.dcel);

    const configuration = configurations.get(idOr(s.innerEdge));
    const x = configuration?.x;

    expect(x?.length).toBe(3);
    expect(x).toEqual([s.edges[0], s.edges[1], s.edges[2]]);
  });
});

describe("getContractionPoint() for a configuration", function () {
  test("where one intersection Point lies on an edge of the boundary which is not part of the configuration, returns 2 intersection point", function () {
    const s = configurationCases.bothNoBlockingPoint;
    const configurations = new ConfigurationGenerator().run(s.dcel);

    const c = configurations.get(idOr(s.innerEdge));

    expect(c?.[ContractionType.N]?.point).toEqual(new Point(-4, 4));
    expect(c?.[ContractionType.P]?.point).toEqual(new Point(1, -2));
  });

  test("where the innerEdge is reflex, returns 1 (positive) intersection point", function () {
    const s = configurationCases.posReflex;
    const configurations = new ConfigurationGenerator().run(s.dcel);

    const c = configurations.get(idOr(s.innerEdge));

    expect(c?.[ContractionType.N]).toBeUndefined();
    expect(c?.[ContractionType.P]?.point).toEqual(new Point(-4, 0));
  });

  test("where the innerEdge is convex, returns 1 (negative) intersection point.", function () {
    const s = configurationCases.negConvex;
    const configurations = new ConfigurationGenerator().run(s.dcel);

    const c = configurations.get(idOr(s.innerEdge));

    expect(c?.[ContractionType.N]?.point).toEqual(new Point(4, 2));
    expect(c?.[ContractionType.P]).toBeUndefined();
  });

  test("where the negative contraction is not feasible (a point of ∂PX is in the contraction area), still returns 2 intersection points.", function () {
    const s = configurationCases.bothBlockingPointNeg;
    const configurations = new ConfigurationGenerator().run(s.dcel);

    const c = configurations.get(idOr(s.innerEdge));

    expect(c?.[ContractionType.N]?.point).toEqual(new Point(-4, 4));
    expect(c?.[ContractionType.P]?.point).toEqual(new Point(1, -2));
  });

  test("where one intersection Point lies on an edge of the boundary which is not part of the configuration, returns 2 intersection points.", function () {
    const s = createConfigurationSetup(
      new Point(-4, 4),
      new Point(0, 0),
      new Point(2, 0),
      new Point(0, -2),
      [new Point(8, 4)],
    );

    const configurations = new ConfigurationGenerator().run(s.dcel);
    const c = configurations.get(idOr(s.innerEdge));

    expect(c?.[ContractionType.N]?.point).toEqual(new Point(-4, 4));
    expect(c?.[ContractionType.P]?.point).toEqual(new Point(1, -1));
  });

  test(" returns 2 contraction points, when one tracks intersects the configuration's first edge,", function () {
    const s = configurationCases.bothContractionOnFirstEdge;
    const configurations = new ConfigurationGenerator().run(s.dcel);
    const c = configurations.get(idOr(s.innerEdge));

    expect(c?.[ContractionType.P]?.point).toEqual(new Point(8, -2));
    expect(c?.[ContractionType.N]?.point).toEqual(new Point(-2, 1.3333333333));
  });

  test("returns 2 contraction points, when one track intersects the configuration's third edge.", function () {
    const s = configurationCases.bothContractionOnThirdEdge;
    const configurations = new ConfigurationGenerator().run(s.dcel);

    const c = configurations.get(idOr(s.innerEdge));

    expect(c?.[ContractionType.P]?.point).toEqual(new Point(-8, -2));
    expect(c?.[ContractionType.N]?.point).toEqual(new Point(2, 1.3333333333));
  });

  test("returns 2 contraction points, when the edge is of inflection type both and the tracks are parallel.", function () {
    const s = configurationCases.bothParallelTracks;
    const configurations = new ConfigurationGenerator().run(s.dcel);

    const c = configurations.get(idOr(s.innerEdge));

    expect(c?.[ContractionType.P]?.point).toEqual(new Point(2, -2));
    expect(c?.[ContractionType.N]?.point).toEqual(new Point(-2, 2));
  });

  test("where the edge is convex and the tracks are parallel, returns 1 contractionPoint.", function () {
    const s = configurationCases.negConvexParallelTracks;
    const configurations = new ConfigurationGenerator().run(s.dcel);
    const c = configurations.get(idOr(s.innerEdge));

    expect(c?.[ContractionType.N]?.point).toEqual(new Point(2, 2));
    expect(c?.[ContractionType.P]).toBeUndefined();
  });
});

describe("getContractionAreaPoints() returns the correct contraction area", function () {
  test("given a negative contraction point.", function () {
    const s = configurationCases.bothBlockingPointNeg;
    const configurations = new ConfigurationGenerator().run(s.dcel);
    const c = configurations.get(idOr(s.innerEdge));
    const areaPoints = c?.[ContractionType.N]?.areaPoints;
    expect(areaPoints?.map((p) => p.xy)).toEqual([
      [-4, 4],
      [-2, 0],
      [2, 0],
      [4, 4],
    ]);
  });

  test("given a positive contraction point.", function () {
    const s = configurationCases.bothBlockingPointNeg;
    const configurations = new ConfigurationGenerator().run(s.dcel);
    const c = configurations.get(idOr(s.innerEdge));
    const areaPoints = c?.[ContractionType.P]?.areaPoints;
    expect(areaPoints?.map((p) => p.xy)).toEqual([
      [1, -2],
      [2, 0],
      [-2, 0],
      [-1, -2],
    ]);
  });

  test("given a negative contraction point on the configuration's first edge.", function () {
    const s = configurationCases.bothContractionOnFirstEdge;
    const configurations = new ConfigurationGenerator().run(s.dcel);
    const c = configurations.get(idOr(s.innerEdge));
    const areaPoints = c?.[ContractionType.N]?.areaPoints;

    expect(areaPoints?.map((p) => p.xy)).toEqual([
      [-2, 1.3333333333],
      [-2, 0],
      [2, 0],
    ]);
  });

  test("given a negative contraction point on the configuration's third edge.", function () {
    const s = configurationCases.bothContractionOnThirdEdge;
    const configurations = new ConfigurationGenerator().run(s.dcel);
    const c = configurations.get(idOr(s.innerEdge));
    const areaPoints = c?.[ContractionType.N]?.areaPoints;

    expect(areaPoints?.map((p) => p.xy)).toEqual([
      [2, 1.3333333333],
      [2, 0],
      [-2, 0],
    ]);
  });
});

describe("x and x_ return the correct number of boundary edges", function () {
  test("for a setup with one interference.", function () {
    const s = configurationCases.bothBlockingPointNeg;
    const configurations = new ConfigurationGenerator().run(s.dcel);
    const c = configurations.get(idOr(s.innerEdge));

    if (!c) {
      throw new Error("Configuration is undefined.");
    }

    expect(c.x.length).toBe(3);
    expect(s.edges.length - c.x_.length).toEqual(c.x.length);
  });
});

describe("isBlockedBy() determines whether or not a contraction is blocked by an edge", function () {
  test("for a negative contraction", function () {
    const s = createConfigurationSetup(
      new Point(-4, 2),
      new Point(-2, 0),
      new Point(2, 0),
      new Point(4, 2),
      [new Point(0, 6), new Point(0, 1)],
    );
    const configurations = new ConfigurationGenerator().run(s.dcel);
    const c = configurations.get(idOr(s.innerEdge));

    expect(
      c?.[ContractionType.N]?.isBlockedBy(s.edges[0], configurations),
    ).toBe(false);
    expect(
      c?.[ContractionType.N]?.isBlockedBy(s.edges[1], configurations),
    ).toBe(false);
    expect(
      c?.[ContractionType.N]?.isBlockedBy(s.edges[2], configurations),
    ).toBe(false);
    expect(
      c?.[ContractionType.N]?.isBlockedBy(s.edges[3], configurations),
    ).toBe(false);
    expect(
      c?.[ContractionType.N]?.isBlockedBy(s.edges[4], configurations),
    ).toBe(true);
  });

  test("for a positive contraction", function () {
    const s = createConfigurationSetup(
      new Point(-4, 0),
      new Point(-2, 2),
      new Point(2, 2),
      new Point(4, 0),
      [new Point(0, 1), new Point(5, -2), new Point(5, 4), new Point(-4, 4)],
    );
    const configurations = new ConfigurationGenerator().run(s.dcel);
    const c = configurations.get(idOr(s.innerEdge));

    expect(
      c?.[ContractionType.P]?.isBlockedBy(s.edges[0], configurations),
    ).toBe(false);
    expect(
      c?.[ContractionType.P]?.isBlockedBy(s.edges[1], configurations),
    ).toBe(false);
    expect(
      c?.[ContractionType.P]?.isBlockedBy(s.edges[2], configurations),
    ).toBe(false);
    expect(
      c?.[ContractionType.P]?.isBlockedBy(s.edges[3], configurations),
    ).toBe(true);
    expect(
      c?.[ContractionType.P]?.isBlockedBy(s.edges[4], configurations),
    ).toBe(true);
    expect(
      c?.[ContractionType.P]?.isBlockedBy(s.edges[5], configurations),
    ).toBe(false);
    expect(
      c?.[ContractionType.P]?.isBlockedBy(s.edges[6], configurations),
    ).toBe(false);
    expect(
      c?.[ContractionType.P]?.isBlockedBy(s.edges[7], configurations),
    ).toBe(false);
  });

  test("and handles edges which are part of X correctly", function () {
    const s = createConfigurationSetup(
      new Point(-4, 0),
      new Point(-2, 2),
      new Point(2, 2),
      new Point(4, 0),
      [new Point(0, 1), new Point(5, -2), new Point(5, 4), new Point(-4, 4)],
    );
    const configurations = new ConfigurationGenerator().run(s.dcel);
    const c = configurations.get(idOr(s.innerEdge));

    expect(
      c?.[ContractionType.P]?.isBlockedBy(s.edges[0], configurations),
    ).toBe(false);
    expect(
      c?.[ContractionType.P]?.isBlockedBy(s.edges[1], configurations),
    ).toBe(false);
    expect(
      c?.[ContractionType.P]?.isBlockedBy(s.edges[2], configurations),
    ).toBe(false);
  });
});

describe("initializeBlockingNumber() returns the number of interfering edges", function () {
  test("for a setup with one interference (partially residing).", function () {
    const s = configurationCases.bothBlockingPointNeg;
    const configurations = new ConfigurationGenerator().run(s.dcel);
    const c = configurations.get(idOr(s.innerEdge));

    expect(c?.[ContractionType.N]?.blockingNumber).toBe(1);
    expect(c?.[ContractionType.P]?.blockingNumber).toBe(0);
  });

  test("for a setup with 3 interferences (partially and entirely residing)", function () {
    const s = createConfigurationSetup(
      new Point(-4, 4),
      new Point(-2, 0),
      new Point(2, 0),
      new Point(1, -2),
      [new Point(6, 2), new Point(1, 1), new Point(-1, 1)],
    );

    const configurations = new ConfigurationGenerator().run(s.dcel);
    const c = configurations.get(idOr(s.innerEdge));

    expect(c?.[ContractionType.N]?.blockingNumber).toBe(3);
    expect(c?.[ContractionType.P]?.blockingNumber).toBe(0);
  });

  test("for a setup with one interference (partially and entirely residing)", function () {
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
    const configurations = new ConfigurationGenerator().run(s.dcel);
    const c = configurations.get(idOr(s.innerEdge));

    expect(c?.[ContractionType.N]?.blockingNumber).toBe(3);
    expect(c?.[ContractionType.P]?.blockingNumber).toBe(2);
  });

  test("for a rectilinear setup", function () {
    const s = createConfigurationSetup(
      new Point(11, 0),
      new Point(11, 1),
      new Point(10, 1),
      new Point(10, 7),
      [new Point(0, 7), new Point(0, 0)],
    );
    const configurations = new ConfigurationGenerator().run(s.dcel);
    const c = configurations.get(idOr(s.innerEdge));

    expect(c?.[ContractionType.N]?.blockingNumber).toBe(1);
    expect(c?.[ContractionType.P]?.blockingNumber).toBe(0);
  });
});

describe("The getter isFeasible returns", function () {
  test("true for a contraction with a contraction point and a blockingnumber of 0, and false if the blocking number is > 0.", function () {
    const s = configurationCases.bothBlockingPointNeg;

    const configurations = new ConfigurationGenerator().run(s.dcel);
    const c = configurations.get(idOr(s.innerEdge));

    expect(c?.[ContractionType.N]?.isFeasible).toBe(false);
    expect(c?.[ContractionType.P]?.isFeasible).toBe(true);
  });
});

describe("getContractionArea() returns", function () {
  test("the Area of an contraction area.", function () {
    const s = configurationCases.bothBlockingPointNeg;
    const configurations = new ConfigurationGenerator().run(s.dcel);
    const c = configurations.get(idOr(s.innerEdge));

    expect(c?.[ContractionType.P]?.area).toBe(6);
    expect(c?.[ContractionType.N]?.area).toBe(24);
  });

  test("the area of an contraction area for a collinear configuration.", function () {
    const s = createConfigurationSetup(
      new Point(-4, 0),
      new Point(-2, 0),
      new Point(2, 0),
      new Point(4, 0),
      [new Point(4, 4), new Point(-4, 4)],
    );
    const configurations = new ConfigurationGenerator().run(s.dcel);
    const c = configurations.get(idOr(s.innerEdge));

    expect(c?.[ContractionType.N]?.area).toEqual(0);
    expect(c?.[ContractionType.P]?.area).toEqual(0);
  });
});

describe("is Complementary() returns", function () {
  let s: ConfigurationSetup;
  let c: Configuration | undefined;
  let pos: Contraction | undefined;
  let neg: Contraction | undefined;
  beforeEach(function () {
    s = configurationCases.bothNoBlockingPoint;
    const configurations = new ConfigurationGenerator().run(s.dcel);
    c = configurations.get(idOr(s.innerEdge));
    pos = c?.[ContractionType.P];
    neg = c?.[ContractionType.N];
  });

  test("true, when the configuration has a contraction point of the complementary contraction type.", function () {
    if (!pos || !neg) {
      throw new Error("Contractions are undefined.");
    }
    expect(neg.isComplementary(pos)).toBe(true);
    expect(pos.isComplementary(neg)).toBe(true);
  });

  test("false, when the configuration has no contraction point of the complementary contraction type.", function () {
    if (!pos || !neg) {
      throw new Error("Contractions are undefined.");
    }
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

  test("for a junction of type A.", function () {
    const edge = dcel.getHalfEdges()[2];
    const configurations = new ConfigurationGenerator().run(dcel);
    const c = configurations.get(idOr(edge));

    const junction = dcel.findVertex(2, 0);
    if (!junction) {
      throw new Error("Junction is undefined.");
    }

    expect(c?.getJunctionType(junction)).toBe(Junction.A);
  });

  test("for a junction of type B.", function () {
    const edge = dcel.getHalfEdges()[6];
    const configurations = new ConfigurationGenerator().run(dcel);
    const c = configurations.get(idOr(edge));
    const junction = dcel.findVertex(1, 2);
    if (!junction) {
      throw new Error("Junction is undefined.");
    }

    expect(c?.getJunctionType(junction)).toBe(Junction.B);
  });

  test("for a configuration with junctions of type A and C.", function () {
    const edge = dcel.getHalfEdges()[14];
    const configurations = new ConfigurationGenerator().run(dcel);
    const c = configurations.get(idOr(edge));
    const junction = dcel.findVertex(3, 2);
    const junction2 = dcel.findVertex(3, 0);
    if (!junction || !junction2) {
      throw new Error("Junctions are undefined.");
    }

    expect(c?.getJunctionType(junction)).toBe(Junction.C);
    expect(c?.getJunctionType(junction2)).toBe(Junction.A);
  });
});
