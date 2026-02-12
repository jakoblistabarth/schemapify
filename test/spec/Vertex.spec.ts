import fs from "fs";
import path from "path";
import Dcel from "@/src/Dcel/Dcel";
import { getTestFiles } from "./test-setup";

describe("distanceToVertex()", function () {
  it("returns the correct distance between 2 vertices", function () {
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
  it("returns the minimum distance between a vertex and an edge", function () {
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
  // TODO: use before each to test more cases based on the same 4 edges

  it("sorts 4 radial edges in clockwise order", function () {
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

    center.edges.push(edgeRight, edgeLeft, edgeBottom, edgeTop);
    center.sortEdges();

    expect(center.edges.map((e) => e.uuid)).toEqual([
      edgeBottom,
      edgeLeft,
      edgeTop,
      edgeRight,
    ].map((e) => e.uuid));
  });

  it("sorts outgoing edges of all vertices in clockwise order", function () {
    const dir = "test/data/shapes";
    const testFiles = getTestFiles(dir);

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
  it("generates a correct triangle dcel when removing one vertex of a square shape", function () {
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

  it("generates a correct triangle dcel when removing one vertex of a square shape with 4 collinear vertices", function () {
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

  it("returns a correctly linked halfedge when removing one vertex of a square shape", function () {
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

  it("returns any of the just created halfedges if no face is given", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/square.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);

    const vertex = dcel.findVertex(0, 0);
    const e = vertex?.remove();

    expect(e?.tail.xy).toEqual([20, 0]);
    expect(e?.head?.xy).toEqual([0, 20]);
  });

  it("returns the specific halfedge if a face is given", function () {
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
    it("return a correct triangular dcel when removing one outer vertex", function () {
      const outerSquare = dcel.getBoundedFaces()[0];
      const [x, y] = coordinates;
      dcel.findVertex(x, y)?.remove();

      expect(outerSquare.getEdges().length).toBe(3);
      expect(outerSquare.getEdges(false).length).toBe(3);
    });
  }

  for (const coordinates of innerVertices) {
    it("return a correct triangular dcel when removing one inner vertex", function () {
      const innerSquare = dcel.getBoundedFaces()[1];
      const [x, y] = coordinates;
      dcel.findVertex(x, y)?.remove();

      expect(innerSquare.getEdges().length).toBe(3);
      expect(innerSquare.getEdges(false).length).toBe(3);
    });
  }
});

describe("equals() on a vertex", function () {
  it("returns true for 2 vertices sharing the same position", function () {
    const dcel = new Dcel();
    const vertexA = dcel.addVertex(10, 10);
    const vertexB = dcel.addVertex(10, 10);

    expect(vertexA.equals(vertexB)).toBe(true);
  });

  it("returns true for one vertex and one point sharing the same position", function () {
    const dcel = new Dcel();
    const vertexA = dcel.addVertex(0.25, -3);
    const pointA = dcel.addVertex(0.25, -3);

    expect(pointA.equals(vertexA)).toBe(true);
  });
});
