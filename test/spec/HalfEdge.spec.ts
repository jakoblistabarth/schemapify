import CRegular from "@/src/c-oriented-schematization/CRegular";
import { getAssignedAngle } from "@/src/c-oriented-schematization/HalfEdgeUtils";
import PreProcessor from "@/src/c-oriented-schematization/PreProcessor";
import Dcel from "@/src/Dcel/Dcel";
import HalfEdge from "@/src/Dcel/HalfEdge";
import Vertex from "@/src/Dcel/Vertex";
import { DECIMAL_SCALE } from "@/src/geometry/constants";
import Line from "@/src/geometry/Line";
import Point from "@/src/geometry/Point";
import fs from "fs";
import path from "path";
import { describe, expect, test } from "vitest";
import { getTestFiles } from "./test-setup";

describe("getLength()", function () {
  test("returns the correct length for a single halfEdge", function () {
    const dcel = new Dcel();
    const a = dcel.addVertex(0, 0);
    const b = dcel.addVertex(2, 0);
    const edge = dcel.addHalfEdge(a, b);
    const edgeTwin = dcel.addHalfEdge(b, a);
    edge.twin = edgeTwin;
    edgeTwin.twin = edge;

    expect(edge.getLength()).toEqual(2);
  });

  test("returns the correct length for all sides of a square", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/square.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);

    dcel
      .getBoundedFaces()[0]
      .edge?.getCycle()
      .forEach((e) => {
        expect(e.getLength()).toBe(20);
      });
  });

  test("returns the correct length for the sides of a triangle", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/triangle.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);

    const lengths = dcel
      .getBoundedFaces()[0]
      .edge?.getCycle()
      .map((e) => e.getLength());
    expect(lengths?.sort()).toEqual([
      14.142135623730951, 14.142135623730951, 20,
    ]);
  });
});

describe("getMidpoint()", function () {
  test("returns the correct length", function () {
    const dcel = new Dcel();
    const a = dcel.addVertex(0, 0);
    const b = dcel.addVertex(2, 0);
    const edge = dcel.addHalfEdge(a, b);
    const edgeTwin = dcel.addHalfEdge(b, a);
    edge.twin = edgeTwin;
    edgeTwin.twin = edge;

    const c = dcel.addVertex(0, 10);
    const edge2 = dcel.addHalfEdge(a, c);
    const edge2Twin = dcel.addHalfEdge(c, a);
    edge2.twin = edge2Twin;
    edge2Twin.twin = edge2;

    expect(edge.getMidpoint()).toEqual(new Point(1, 0));
    expect(edge2.getMidpoint()).toEqual(new Point(0, 5));
  });
});

describe("distanceToEdge()", function () {
  test("returns the minimum distance between 2 edges", function () {
    const dcel = new Dcel();
    const a = dcel.addVertex(0, 0);
    const b = dcel.addVertex(-10, 10);
    const v = dcel.addVertex(-1, -2);
    const w = dcel.addVertex(2, 1);

    const ab = dcel.addHalfEdge(a, b);
    const abTwin = dcel.addHalfEdge(b, a);
    ab.twin = abTwin;
    abTwin.twin = ab;

    const vw = dcel.addHalfEdge(v, w);
    const vwTwin = dcel.addHalfEdge(w, v);
    vw.twin = vwTwin;
    vwTwin.twin = vw;

    expect(ab.distanceToEdge(vw)).toEqual(Math.sqrt(0.5));
    expect(vw.distanceToEdge(ab)).toEqual(Math.sqrt(0.5));
  });
});

describe("getAngle()", function () {
  test("returns the correct angle", function () {
    const dcel = new Dcel();
    const center = dcel.addVertex(0, 0);

    const headRight = dcel.addVertex(4, 0);
    const edgeRight = dcel.addHalfEdge(center, headRight);
    const edgeRightTwin = dcel.addHalfEdge(headRight, center);
    edgeRight.twin = edgeRightTwin;
    edgeRightTwin.twin = edgeRight;

    const headBottom = dcel.addVertex(0, -1);
    const edgeBottom = dcel.addHalfEdge(center, headBottom);
    const edgeBottomTwin = dcel.addHalfEdge(headBottom, center);
    edgeBottom.twin = edgeBottomTwin;
    edgeBottomTwin.twin = edgeBottom;

    const headLeft = dcel.addVertex(-20, 0);
    const edgeLeft = dcel.addHalfEdge(center, headLeft);
    const edgeLeftTwin = dcel.addHalfEdge(headLeft, center);
    edgeLeft.twin = edgeLeftTwin;
    edgeLeftTwin.twin = edgeLeft;

    const headTop = dcel.addVertex(0, 100);
    const edgeTop = dcel.addHalfEdge(center, headTop);
    const edgeTopTwin = dcel.addHalfEdge(headTop, center);
    edgeTop.twin = edgeTopTwin;
    edgeTopTwin.twin = edgeTop;

    expect(edgeRight.getAngle()).toBe(0);
    expect(edgeTop.getAngle()).toBe(Math.PI * 0.5);
    expect(edgeLeft.getAngle()).toBe(Math.PI);
    expect(edgeBottom.getAngle()).toBe(Math.PI * 1.5);
  });
});

describe("getAssignedDirection()", function () {
  test("returns the correct angle", function () {
    const c = new CRegular(2);
    const { sectors } = c;
    expect(getAssignedAngle(1, sectors)).toBe(c.angles[1]);
    expect(getAssignedAngle(2, sectors)).toBe(c.angles[2]);
    expect(getAssignedAngle(3, sectors)).toBe(c.angles[3]);
    expect(getAssignedAngle(0, sectors)).toBe(c.angles[0]);
  });
});

describe("getCycle()", function () {
  test("returns the correct number of edges for square", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/square.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);

    expect(dcel.getBoundedFaces()[0].edge?.getCycle().length).toBe(4);
    expect(dcel.getBoundedFaces()[0].edge?.twin?.getCycle().length).toBe(4);
  });

  test("returns the correct number of edges for a triangle", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/triangle.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);

    expect(dcel.getBoundedFaces()[0].edge?.getCycle().length).toBe(3);
    expect(dcel.getBoundedFaces()[0].edge?.twin?.getCycle().length).toBe(3);
  });
});

describe("subdivide() on geodata results in a Dcel", function () {
  const dir = "test/data/geodata";
  const testFiles = [
    "AUT_adm1-simple.json",
    "AUT_adm0-s1.json",
    "ne_50m_africa_admin0-s20.json",
    "ne_50m_europe_mapunits-s20.json",
  ];

  testFiles.forEach((file) => {
    test(
      "with complete cycles for all faces in counter-clockwise and clockwise direction of file " +
        file,
      function () {
        const json = JSON.parse(
          fs.readFileSync(path.resolve(dir + "/" + file), "utf8"),
        );
        const dcel = Dcel.fromGeoJSON(json);

        const cycles: HalfEdge[][] = [];
        dcel.getBoundedFaces().forEach((f) => {
          cycles.push(f.getEdges());
          cycles.push(f.getEdges(false));
        });

        expect(cycles.length).toBeGreaterThanOrEqual(1);
      },
    );
  });
});

describe("subdivide() on simple shapes results in a Dcel", function () {
  const dir = "test/data/shapes";
  const testFiles = getTestFiles(dir, true);

  testFiles.forEach((file) => {
    test(
      "with complete cycles for all faces in counter-clockwise and clockwise direction of file " +
        file,
      function () {
        const json = JSON.parse(
          fs.readFileSync(path.resolve(dir + "/" + file), "utf8"),
        );
        const dcel = Dcel.fromGeoJSON(json);
        dcel
          .getBoundedFaces()
          .forEach((f) => f.getEdges().forEach((e) => e.subdivide()));

        const cycles: HalfEdge[][] = [];
        dcel.getBoundedFaces().forEach((f) => {
          cycles.push(f.getEdges());
          cycles.push(f.getEdges(false));
        });

        expect(cycles.length).toBeGreaterThanOrEqual(1);
      },
    );
  });
});

describe("subdivide()", function () {
  test("on one edge of a triangle results in 4 linked halfEdges", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/triangle.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel.getBoundedFaces()[0].getEdges()[0].subdivide();

    expect(dcel.getBoundedFaces()[0].getEdges().length).toBe(4);
    expect(dcel.getBoundedFaces()[0].getEdges(false).length).toBe(4);
    expect(dcel.getBoundedFaces()[0].edge?.twin?.getCycle().length).toBe(4);
    expect(dcel.getBoundedFaces()[0].edge?.twin?.getCycle(false).length).toBe(
      4,
    );
  });

  test("on one edge of a square results in 5 linked outer halfEdges", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/square.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel.getBoundedFaces()[0].getEdges()[0].subdivide();

    expect(dcel.getBoundedFaces()[0].edge?.twin?.getCycle().length).toBe(5);
    expect(dcel.getBoundedFaces()[0].edge?.twin?.getCycle(false).length).toBe(
      5,
    );
  });

  test("on one outer edge of a square results in 5 linked inner halfEdges", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/square.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel.getBoundedFaces()[0].edge?.twin?.subdivide();

    expect(dcel.getFaces().length).toBe(2);
    expect(dcel.halfEdges.size).toBe(10);

    expect(dcel.getBoundedFaces()[0].getEdges().length).toBe(5);
    expect(dcel.getBoundedFaces()[0].getEdges(false).length).toBe(5);
  });

  test("on one inneredge of a square results in 5 linked outer halfEdges", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/square.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel.getBoundedFaces()[0].edge?.subdivide();

    expect(dcel.getFaces().length).toBe(2);
    expect(dcel.halfEdges.size).toBe(10);

    expect(dcel.getBoundedFaces()[0].edge?.twin?.getCycle().length).toBe(5);
    expect(dcel.getBoundedFaces()[0].edge?.twin?.getCycle(false).length).toBe(
      5,
    );
  });

  test("on a square with a specified point, which is not on the origina edge, results in a correct dcel", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/square.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel.getBoundedFaces()[0].edge?.subdivide(new Point(1, 1));

    expect(dcel.getFaces().length).toBe(2);
    expect(dcel.halfEdges.size).toBe(10);

    expect(dcel.getBoundedFaces()[0].edge?.twin?.getCycle().length).toBe(5);
    expect(dcel.getBoundedFaces()[0].edge?.twin?.getCycle(false).length).toBe(
      5,
    );
  });

  test("on the 1st outer edge of the first of 2 adjacent triangles results in 4 and 3 linked inner and 5 linked outer halfEdges", function () {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/2triangle-adjacent.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel.getBoundedFaces()[0].getEdges()[1].subdivide();

    expect(dcel.getFaces().length).toBe(3);
    expect(dcel.halfEdges.size).toBe(12);

    expect(dcel.getBoundedFaces()[0].getEdges().length).toBe(4);
    expect(dcel.getBoundedFaces()[0].getEdges(false).length).toBe(4);
    expect(dcel.getBoundedFaces()[1].getEdges().length).toBe(3);
    expect(dcel.getBoundedFaces()[1].getEdges(false).length).toBe(3);
    expect(dcel.getBoundedFaces()[0].edge?.twin?.getCycle().length).toBe(5);
    expect(dcel.getBoundedFaces()[0].edge?.twin?.getCycle(false).length).toBe(
      5,
    );
  });

  test("on the 2nd outer edge of the first of 2 adjacent triangles results in 4 and 3 linked inner and 5 linked outer halfEdges", function () {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/2triangle-adjacent.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel.getBoundedFaces()[0].getEdges()[2].subdivide();

    expect(dcel.getFaces().length).toBe(3);
    expect(dcel.halfEdges.size).toBe(12);

    expect(dcel.getBoundedFaces()[0].getEdges().length).toBe(4);
    expect(dcel.getBoundedFaces()[0].getEdges(false).length).toBe(4);
    expect(dcel.getBoundedFaces()[1].getEdges().length).toBe(3);
    expect(dcel.getBoundedFaces()[1].getEdges(false).length).toBe(3);
    expect(dcel.getBoundedFaces()[0].edge?.twin?.getCycle().length).toBe(5);
    expect(dcel.getBoundedFaces()[0].edge?.twin?.getCycle(false).length).toBe(
      5,
    );
  });
});

describe("subdivideToThreshold()", function () {
  test("turns a square with side length 20 into a dcel with 4 times more halfedges 8 edges (epsilon: 5.01, subdivides 2 times)", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/square.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);
    const result = new PreProcessor(5.01).run(dcel);

    expect(result.halfEdges.size).toBe(dcel.halfEdges.size * 4);
  });

  test("turns a square with sides of length 20 into a dcel with 64 edges (epsilon: 2.51)", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/square.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);
    const result = new PreProcessor(2.51).run(dcel);

    // Every side of the square is subdivided 3 times
    // resulting in 2^3 = 8 edges (16 halfEdges) per side
    expect(result.halfEdges.size).toBe(64);
  });
});

describe("intersectsLine()", function () {
  test("returns the intersection point if the halfedge intersects with a line", function () {
    const dcel = new Dcel();
    const a = dcel.addVertex(0, 0);
    const b = dcel.addVertex(2, 2);
    const halfEdge = dcel.addHalfEdge(a, b);
    const halfEdgeTwin = dcel.addHalfEdge(b, a);
    halfEdge.twin = halfEdgeTwin;
    halfEdgeTwin.twin = halfEdge;
    const line = new Line(new Point(1, 1), 0);

    expect(halfEdge.intersectsLine(line)?.x).toBeCloseTo(1, DECIMAL_SCALE);
    expect(halfEdge.intersectsLine(line)?.y).toBeCloseTo(1, DECIMAL_SCALE);
  });

  test("returns the intersection point if the halfedge intersects with a line", function () {
    const dcel = new Dcel();
    const a = dcel.addVertex(2, 0);
    const b = dcel.addVertex(0, 2);
    const halfEdge = dcel.addHalfEdge(a, b);
    const halfEdgeTwin = dcel.addHalfEdge(b, a);
    halfEdge.twin = halfEdgeTwin;
    halfEdgeTwin.twin = halfEdge;
    const line = new Line(new Point(2, 1), 0);

    expect(halfEdge.intersectsLine(line)?.x).toBeCloseTo(1, DECIMAL_SCALE);
    expect(halfEdge.intersectsLine(line)?.y).toBeCloseTo(1, DECIMAL_SCALE);
  });

  test("returns undefined if the halfedge and the line are parallel and do not share a vertex", function () {
    const dcel = new Dcel();
    const a = dcel.addVertex(0, 0);
    const b = dcel.addVertex(2, 0);
    const halfEdge = dcel.addHalfEdge(a, b);
    const halfEdgeTwin = dcel.addHalfEdge(b, a);
    halfEdge.twin = halfEdgeTwin;
    halfEdgeTwin.twin = halfEdge;
    const line = new Line(new Point(0, 4), 0);

    expect(halfEdge.intersectsLine(line)).toBeUndefined();
  });

  test("returns ? if the halfedge is in line with the line", function () {
    const dcel = new Dcel();
    const a = dcel.addVertex(0, 0);
    const b = dcel.addVertex(2, 0);
    const halfEdge = dcel.addHalfEdge(a, b);
    const halfEdgeTwin = dcel.addHalfEdge(b, a);
    halfEdge.twin = halfEdgeTwin;
    halfEdgeTwin.twin = halfEdge;
    const line = new Line(new Point(-2, 0), 0);

    expect(halfEdge.intersectsLine(line)).toBeUndefined();
  });

  test("returns undefined if the halfedge does not intersect with a line", function () {
    const dcel = new Dcel();
    const a = dcel.addVertex(0, 0);
    const b = dcel.addVertex(2, 2);
    const halfEdge = dcel.addHalfEdge(a, b);
    const halfEdgeTwin = dcel.addHalfEdge(b, a);
    halfEdge.twin = halfEdgeTwin;
    halfEdgeTwin.twin = halfEdge;
    const line = new Line(new Point(0, 3), 0);

    expect(halfEdge.intersectsLine(line)).toBeUndefined();
  });
});

describe("getMinimalCycleDistance()", function () {
  test("returns the correct distance for a square.", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/square.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);

    const edge0 = dcel.getHalfEdges()[0];

    expect(edge0.getMinimalCycleDistance(dcel.getHalfEdges()[2])).toBe(1);
    expect(edge0.getMinimalCycleDistance(dcel.getHalfEdges()[4])).toBe(2);
    expect(edge0.getMinimalCycleDistance(dcel.getHalfEdges()[6])).toBe(1);
  });
});

describe("moveTo().", function () {
  test("moves an edge where both new position are free.", function () {
    const dcel = Dcel.fromCoordinates([
      [
        [
          [
            [0, 0],
            [0, 1],
            [1, 1],
            [1, 0],
            [0, 0],
          ],
        ],
      ],
    ]);
    dcel
      .findHalfEdge(new Point(0, 0), new Point(0, 1))
      ?.moveTo(new Point(-2, 0), new Point(-2, 1));

    expect(dcel.findVertex(-2, 0)).toBeInstanceOf(Vertex);
    expect(dcel.findVertex(-2, 1)).toBeInstanceOf(Vertex);
    expect(dcel.findVertex(1, 1)).toBeInstanceOf(Vertex);
    expect(dcel.findVertex(1, 0)).toBeInstanceOf(Vertex);
    expect(dcel.vertices.size).toBe(4);
  });

  test("moves an edge where both new position are free.", function () {
    const dcel = Dcel.fromCoordinates([
      [
        [
          [
            [0, 0],
            [0, 1],
            [1, 1],
            [1, 0],
            [0, 0],
          ],
        ],
      ],
    ]);
    dcel
      .findHalfEdge(new Point(0, 0), new Point(0, 1))
      ?.moveTo(new Point(0, -1), new Point(0, 0));

    expect(dcel.findVertex(0, -1)).toBeInstanceOf(Vertex);
    expect(dcel.findVertex(0, 0)).toBeInstanceOf(Vertex);
    expect(dcel.findVertex(1, 1)).toBeInstanceOf(Vertex);
    expect(dcel.findVertex(1, 0)).toBeInstanceOf(Vertex);
    expect(dcel.vertices.size).toBe(4);
  });

  test("moves an edge where one position is free.", function () {
    const dcel = Dcel.fromCoordinates([
      [
        [
          [
            [0, 0],
            [1.5, 0],
            [1.5, 0.25],
            [1, 0.25],
            [1, 1],
            [0, 1],
            [0, 0],
          ],
        ],
      ],
    ]);
    dcel
      .findHalfEdge(new Point(1.5, 0), new Point(1.5, 0.25))
      ?.moveTo(new Point(1, 0), new Point(1, 0.25));

    expect(dcel.findVertex(0, 0)).toBeInstanceOf(Vertex);
    expect(dcel.findVertex(1, 0)).toBeInstanceOf(Vertex);
    expect(dcel.findVertex(1, 0.25)).toBeInstanceOf(Vertex);
    expect(dcel.findVertex(1, 1)).toBeInstanceOf(Vertex);
    expect(dcel.findVertex(0, 1)).toBeInstanceOf(Vertex);
    expect(dcel.vertices.size).toBe(5);
    expect(dcel.getBoundedFaces()[0].getEdges().length).toBe(5);
    expect(dcel.getBoundedFaces()[0].getEdges(false).length).toBe(5);
    expect(dcel.getBoundedFaces()[0].edge.twin?.getCycle().length).toBe(5);
    expect(dcel.getBoundedFaces()[0].edge.twin?.getCycle(false).length).toBe(5);
  });

  test("Moves an edge, without affecting any other vertices or halfedges if both target points are new", function () {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/smallest-contraction.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    const edgeToMove = dcel.getBoundedFaces()[0].getEdges()[1];
    const movedReturned = edgeToMove.moveTo(
      new Point(10.5, 0),
      new Point(10.5, 1),
    );

    const moved = dcel.getBoundedFaces()[0].getEdges()[1];
    expect(moved).toBe(movedReturned);
    expect(moved.tail?.x).toBe(10.5);
    expect(moved.tail?.y).toBe(0);
    expect(moved.head?.x).toBe(10.5);
    expect(moved.head?.y).toBe(1);
  });

  test("moveTo() deletes (merges) a vertex if one target point is already existing.", function () {
    //TO-DO: does not yet handle removing collinear points (in this case the vertex at (10, 1) would be collinear and should be removed)
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/smallest-contraction.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    const edgeToMove = dcel.getBoundedFaces()[0].getEdges()[1];
    const movedReturned = edgeToMove.moveTo(new Point(10, 0), new Point(10, 1));

    expect(dcel.findVertex(11, 0)).toBeUndefined();
    expect(dcel.findVertex(11, 1)).toBeUndefined();
    expect(dcel.findVertex(10, 0)).toBeDefined();
    expect(dcel.findVertex(10, 1)).toBeDefined();
    expect(dcel.vertices.size).toBe(9);
    expect(dcel.getBoundedFaces()[0].getEdges().length).toBe(9);
    expect(dcel.getBoundedFaces()[0].getEdges(false).length).toBe(9);
    expect(dcel.getBoundedFaces()[0].edge.twin?.getCycle().length).toBe(9);
    expect(dcel.getBoundedFaces()[0].edge.twin?.getCycle(false).length).toBe(9);

    const movedEdge = dcel.findHalfEdge(new Point(10, 0), new Point(10, 1));
    expect(movedEdge?.coordKey).toBe(movedReturned?.coordKey);
    expect(movedEdge?.id).toBe(movedReturned?.id);
    expect(movedEdge?.tail.xy).toEqual([10, 0]);
    expect(movedEdge?.head?.xy).toEqual([10, 1]);
  });

  test("deletes (merges) vertices if both target points are existing.", function () {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/smallest-contraction.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel
      .getBoundedFaces()[0]
      .getEdges()[5]
      .moveTo(new Point(10, 7), new Point(10, 8));

    const e3 = dcel.getBoundedFaces()[0].getEdges()[3];
    const e4 = dcel.getBoundedFaces()[0].getEdges()[4];
    const e5 = dcel.getBoundedFaces()[0].getEdges()[5];
    expect(e3.tail.xy).toEqual([10, 1]);
    expect(e3.head?.xy).toEqual([10, 7]);
    expect(e4.tail.xy).toEqual([10, 7]);
    expect(e4.head?.xy).toEqual([10, 8]);
    expect(e5.tail.xy).toEqual([10, 8]);
    expect(e5.head?.xy).toEqual([10, 10]);
  });
});
