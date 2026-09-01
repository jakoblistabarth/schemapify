import Dcel from "@/src/Dcel/Dcel";
import HalfEdge from "@/src/Dcel/HalfEdge";
import Vertex from "@/src/Dcel/Vertex";
import { DECIMAL_SCALE, EPSILON } from "@/src/geometry/constants";
import Point from "@/src/geometry/Point";
import { normalizeAngle, permute } from "@/src/utilities";
import fs from "fs";
import path from "path";
import { beforeEach, describe, expect, test } from "vitest";
import { getTestFiles } from "./test-setup";

const isCircularlySortedByAngle = (edges: HalfEdge[], clockwise = true) => {
  const angles = edges.map((e) => {
    const a = e.getAngle();
    return typeof a === "number" ? normalizeAngle(a) : NaN;
  });
  if (angles.some(Number.isNaN)) return false;
  return Array.from({ length: angles.length }).some((_, rotation) =>
    Array.from({ length: Math.max(0, angles.length - 1) }).every((__, i) => {
      const a = angles[(rotation + i) % angles.length];
      const b = angles[(rotation + i + 1) % angles.length];
      return clockwise ? a + EPSILON >= b : a <= b + EPSILON;
    }),
  );
};

describe("distanceToVertex()", function () {
  test("returns the correct distance between 2 vertices", function () {
    const dcel = new Dcel();
    const a = dcel.addVertex(0, 0);
    const b = dcel.addVertex(4, 0);
    const c = dcel.addVertex(4, 4);
    const d = dcel.addVertex(-4, -4);

    expect(b.distanceToVertex(a)).toEqual(b.distanceToVertex(a));
    expect(a.distanceToVertex(b)).toEqual(4);
    expect(a.distanceToVertex(c)).toEqual(Math.sqrt(4 * 4 + 4 * 4));
    expect(d.distanceToVertex(a)).toEqual(Math.sqrt(-4 * -4 + -4 * -4));
  });
});

describe("distanceToEdge()", function () {
  test("returns the minimum distance between a vertex and an edge", function () {
    const dcel = new Dcel();
    const a = dcel.addVertex(0, 0);
    const v = dcel.addVertex(-1, -2);
    const w = dcel.addVertex(2, 1);

    const edge = dcel.addHalfEdge(v, w);
    const twin = dcel.addHalfEdge(w, v);
    edge.twin = twin;
    twin.twin = edge;

    expect(a.distanceToEdge(edge)).toEqual(Math.sqrt(0.5));
    expect(v.distanceToEdge(edge)).toEqual(0);
  });
});

describe("sortEdges()", function () {
  let center: Vertex;
  let edgeRight: HalfEdge;
  let edgeBottom: HalfEdge;
  let edgeLeft: HalfEdge;
  let edgeTop: HalfEdge;

  beforeEach(function () {
    const dcel = new Dcel();
    center = dcel.addVertex(0, 0);

    const headRight = dcel.addVertex(4, 0);
    edgeRight = dcel.addHalfEdge(center, headRight);
    const edgeRightTwin = dcel.addHalfEdge(headRight, center);
    edgeRight.twin = edgeRightTwin;
    edgeRightTwin.twin = edgeRight;

    const headBottom = dcel.addVertex(0, -1);
    edgeBottom = dcel.addHalfEdge(center, headBottom);
    const edgeBottomTwin = dcel.addHalfEdge(headBottom, center);
    edgeBottom.twin = edgeBottomTwin;
    edgeBottomTwin.twin = edgeBottom;

    const headLeft = dcel.addVertex(-20, 0);
    edgeLeft = dcel.addHalfEdge(center, headLeft);
    const edgeLeftTwin = dcel.addHalfEdge(headLeft, center);
    edgeLeft.twin = edgeLeftTwin;
    edgeLeftTwin.twin = edgeLeft;

    const headTop = dcel.addVertex(0, 100);
    edgeTop = dcel.addHalfEdge(center, headTop);
    const edgeTopTwin = dcel.addHalfEdge(headTop, center);
    edgeTop.twin = edgeTopTwin;
    edgeTopTwin.twin = edgeTop;
  });

  const permutations = permute(["right", "left", "bottom", "top"]);

  permutations.forEach((permutation, idx) => {
    test(`sorts 4 radial edges in clockwise order (permutation ${idx + 1})`, function () {
      const map: Record<string, HalfEdge> = {
        right: edgeRight,
        left: edgeLeft,
        bottom: edgeBottom,
        top: edgeTop,
      };
      center.edges = permutation.map((k) => map[k]);

      center.sortEdges();

      // Verify circular order by angle (clockwise)
      expect(isCircularlySortedByAngle(center.edges, true)).toBe(true);
    });
  });

  test("sorts outgoing edges of all vertices in clockwise order", function () {
    const dir = "test/data/shapes";
    const testFiles = getTestFiles(dir, true);

    testFiles.forEach((file) => {
      const json = JSON.parse(
        fs.readFileSync(path.resolve(dir + "/" + file), "utf8"),
      );
      const dcel = Dcel.fromGeoJSON(json);

      dcel.vertices.forEach((vertex) => {
        const angles = vertex.edges.map((e) => e.getAngle()) as number[];
        expect(angles.every((v, i, a) => !i || a[i - 1] >= v)).toBe(true);
      });
    });
  });
});

describe("remove() on a vertex", function () {
  test("generates a correct triangle dcel when removing one vertex of a square shape", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/square.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);

    const squareFace = dcel.getBoundedFaces()[0];
    const vertex = dcel.findVertex(0, 0);
    vertex?.remove();

    expect(squareFace.getEdges().length).toBe(3);
    expect(squareFace.getEdges(false).length).toBe(3);
    expect(dcel.halfEdges.size).toBe(6);
    expect(dcel.vertices.size).toBe(3);
  });

  test("generates a correct triangle dcel when removing one vertex of a square shape with 4 collinear vertices", function () {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/square-with-collinear-vertices.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);

    const squareFace = dcel.getBoundedFaces()[0];
    const vertex = dcel.findVertex(0, 5);
    const newEdge = vertex?.remove(squareFace);

    expect(squareFace.getEdges().length).toBe(5);
    expect(squareFace.getEdges(false).length).toBe(5);
    expect(dcel.halfEdges.size).toBe(10);
    expect(dcel.vertices.size).toBe(5);
    expect(newEdge?.tail.xy).toEqual([5, 5]);
    expect(newEdge?.head?.xy).toEqual([0, 0]);
  });

  test("returns a correctly linked halfedge when removing one vertex of a square shape", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/square.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);

    const squareFace = dcel.getBoundedFaces()[0];
    const vertex = dcel.findVertex(0, 0);
    const newEdge = vertex?.remove(squareFace);

    expect(newEdge?.prev?.tail.xy).toEqual([20, 20]);
    expect(newEdge?.prev?.head?.xy).toEqual([0, 20]);
    expect(newEdge?.prev?.tail.xy).toEqual([20, 20]);
    expect(newEdge?.prev?.head?.xy).toEqual([0, 20]);
    expect(newEdge?.prev?.next?.tail.xy).toEqual([0, 20]);
    expect(newEdge?.prev?.next?.head?.xy).toEqual([20, 0]);
    expect(newEdge?.next?.tail.xy).toEqual([20, 0]);
    expect(newEdge?.next?.head?.xy).toEqual([20, 20]);
    expect(newEdge?.next?.tail.xy).toEqual([20, 0]);
    expect(newEdge?.next?.head?.xy).toEqual([20, 20]);
    expect(newEdge?.next?.prev?.tail.xy).toEqual([0, 20]);
    expect(newEdge?.next?.prev?.head?.xy).toEqual([20, 0]);
  });

  test("returns any of the just created halfedges if no face is given", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/square.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);

    const vertex = dcel.findVertex(0, 0);
    const e = vertex?.remove();

    expect(e?.tail.xy).toEqual([20, 0]);
    expect(e?.head?.xy).toEqual([0, 20]);
  });

  test("returns the specific halfedge if a face is given", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/square.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);

    const squareFace = dcel.getBoundedFaces()[0];
    const vertex = dcel.findVertex(0, 0);
    const e = vertex?.remove(squareFace);

    expect(e?.tail.xy).toEqual([0, 20]);
    expect(e?.head?.xy).toEqual([20, 0]);
  });
});

describe("remove() on all vertices of a square with a hole", function () {
  let dcel: Dcel;
  beforeEach(function () {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/square-hole.json"),
        "utf8",
      ),
    );
    dcel = Dcel.fromGeoJSON(json);
  });

  const outerVertices = [
    [0, 0],
    [2, 0],
    [2, 2],
    [0, 2],
  ];

  const innerVertices = [
    [1.25, 1.25],
    [1.25, 1.5],
    [1.5, 1.5],
    [1.5, 1.25],
    [1.25, 1.25],
  ];

  for (const coordinates of outerVertices) {
    test("return a correct triangular dcel when removing one outer vertex", function () {
      const outerSquare = dcel.getBoundedFaces()[0];
      const [x, y] = coordinates;
      dcel.findVertex(x, y)?.remove();

      expect(outerSquare.getEdges().length).toBe(3);
      expect(outerSquare.getEdges(false).length).toBe(3);
    });
  }

  for (const coordinates of innerVertices) {
    test("return a correct triangular dcel when removing one inner vertex", function () {
      const innerSquare = dcel.getBoundedFaces()[1];
      const [x, y] = coordinates;
      dcel.findVertex(x, y)?.remove();

      expect(innerSquare.getEdges().length).toBe(3);
      expect(innerSquare.getEdges(false).length).toBe(3);
    });
  }
});

describe("equals() on a vertex", function () {
  test("returns true for 2 vertices sharing the same position", function () {
    const dcel = new Dcel();
    const vertexA = dcel.addVertex(10, 10);
    const vertexB = dcel.addVertex(10, 10);

    expect(vertexA.equals(vertexB)).toBe(true);
  });

  test("returns true for one vertex and one point sharing the same position", function () {
    const dcel = new Dcel();
    const vertexA = dcel.addVertex(0.25, -3);
    const pointA = dcel.addVertex(0.25, -3);

    expect(pointA.equals(vertexA)).toBe(true);
  });
});

describe("splitOff()", function () {
  /**
   * The junction at (1, 2) of edge-move-test, where three faces meet: an edge leaves
   * it at 270, one at 135 and one at 0 degrees.
   */
  const junctionSetup = () => {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/edge-move-test.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    const junction = dcel.findVertex(1, 2);
    const edge = junction?.edges.find(
      ({ head }) => head?.x === 1 && head?.y === 1,
    );
    const track = junction?.edges.find(
      ({ head }) => head?.x === 3 && head?.y === 2,
    );
    if (!junction || !edge || !track) throw new Error("expected a junction");
    return { dcel, junction, edge, track };
  };

  test("hands the edge to a new vertex and leaves the rest on the old one", function () {
    const { junction, edge, track } = junctionSetup();

    const split = junction.splitOff(edge, track, new Point(1.5, 2));

    expect(split?.xy).toEqual([1.5, 2]);
    expect(junction.degree).toBe(2);
    expect(split?.degree).toBe(3);
    expect(split?.edges).toContain(edge);
    expect(junction.edges).not.toContain(edge);
  });

  test("leaves the boundary walkable and the area untouched", function () {
    const { dcel, junction, edge, track } = junctionSetup();
    const area = dcel.getArea();

    junction.splitOff(edge, track, new Point(1.5, 2));

    expect(() => dcel.toSubdivision()).not.toThrow();
    expect(dcel.getArea()).toBeCloseTo(area, DECIMAL_SCALE);
  });

  test("hands the faces beside the track over with it", function () {
    // The edge takes the area between where it was and where it now runs with it,
    // which the face on its other side gives up.
    const { dcel, junction, edge, track } = junctionSetup();
    const before = dcel.getBoundedFaces().map((face) => face.getArea());

    junction.splitOff(edge, track, new Point(1.5, 2));

    const after = dcel.getBoundedFaces().map((face) => face.getArea());
    expect(after[0]).toBeCloseTo((before[0] ?? 0) + 0.25, DECIMAL_SCALE);
    expect(after[1]).toBeCloseTo((before[1] ?? 0) - 0.25, DECIMAL_SCALE);
  });

  test("does nothing where the edge and the track are not both on the vertex", function () {
    const { junction, edge, track } = junctionSetup();

    expect(junction.splitOff(edge, edge, new Point(1.5, 2))).toBeUndefined();
    expect(
      junction.splitOff(track.twin as HalfEdge, track, new Point(1.5, 2)),
    ).toBeUndefined();
  });
});
