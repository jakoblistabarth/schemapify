import fs from "fs";
import path from "path";
import Vertex from "@/src/Dcel/Vertex";
import HalfEdge from "@/src/Dcel/HalfEdge";
import Dcel from "@/src/Dcel/Dcel";
import { getTestFiles } from "./test-setup";

describe("distanceToVertex()", function () {
  it("returns the correct distance between 2 vertices", function () {
    const a = new Vertex(0, 0, new Dcel());
    const b = new Vertex(4, 0, new Dcel());
    const c = new Vertex(4, 4, new Dcel());
    const d = new Vertex(-4, -4, new Dcel());

    expect(b.distanceToVertex(a)).toEqual(b.distanceToVertex(a));
    expect(a.distanceToVertex(b)).toEqual(4);
    expect(a.distanceToVertex(c)).toEqual(Math.sqrt(4 * 4 + 4 * 4));
    expect(d.distanceToVertex(a)).toEqual(Math.sqrt(-4 * -4 + -4 * -4));
  });
});

describe("distanceToEdge()", function () {
  it("returns the minimum distance between a vertex and an edge", function () {
    const a = new Vertex(0, 0, new Dcel());
    const v = new Vertex(-1, -2, new Dcel());
    const w = new Vertex(2, 1, new Dcel());

    const edge = new HalfEdge(v, new Dcel());
    edge.twin = new HalfEdge(w, new Dcel());
    edge.twin.twin = edge;

    expect(a.distanceToEdge(edge)).toEqual(Math.sqrt(0.5));
    expect(v.distanceToEdge(edge)).toEqual(0);
  });
});

describe("sortEdges()", function () {
  // TODO: use before each to test more cases based on the same 4 edges

  it("sorts 4 radial edges in clockwise order", function () {
    const center = new Vertex(0, 0, new Dcel());

    const headRight = new Vertex(4, 0, new Dcel());
    const edgeRight = new HalfEdge(center, new Dcel());
    edgeRight.twin = new HalfEdge(headRight, new Dcel());
    edgeRight.twin.twin = edgeRight;

    const headBottom = new Vertex(0, -1, new Dcel());
    const edgeBottom = new HalfEdge(center, new Dcel());
    edgeBottom.twin = new HalfEdge(headBottom, new Dcel());
    edgeBottom.twin.twin = edgeBottom;

    const headLeft = new Vertex(-20, 0, new Dcel());
    const edgeLeft = new HalfEdge(center, new Dcel());
    edgeLeft.twin = new HalfEdge(headLeft, new Dcel());
    edgeLeft.twin.twin = edgeLeft;

    const headTop = new Vertex(0, 100, new Dcel());
    const edgeTop = new HalfEdge(center, new Dcel());
    edgeTop.twin = new HalfEdge(headTop, new Dcel());
    edgeTop.twin.twin = edgeTop;

    center.edges.push(edgeRight, edgeLeft, edgeBottom, edgeTop);
    center.sortEdges();

    expect(center.edges).toEqual([edgeBottom, edgeLeft, edgeTop, edgeRight]);
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
    expect(newEdge?.prev?.toString()).toBe("20/20->0/20");
    expect(newEdge?.prev?.next?.toString()).toBe("0/20->20/0");
    expect(newEdge?.next?.tail.xy).toEqual([20, 0]);
    expect(newEdge?.next?.head?.xy).toEqual([20, 20]);
    expect(newEdge?.next?.toString()).toBe("20/0->20/20");
    expect(newEdge?.next?.prev?.toString()).toBe("0/20->20/0");
  });

  it("returns any of the just created halfedges if no face is given", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/square.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);

    const vertex = dcel.findVertex(0, 0);
    const e = vertex?.remove();

    expect(e?.toString()).toBe("20/0->0/20");
  });

  it("returns the specific halfedge if a face is given", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/square.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);

    const squareFace = dcel.getBoundedFaces()[0];
    const vertex = dcel.findVertex(0, 0);
    const e = vertex?.remove(squareFace);

    expect(e?.toString()).toBe("0/20->20/0");
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
    const vertexA = new Vertex(10, 10, new Dcel());
    const vertexB = new Vertex(10, 10, new Dcel());

    expect(vertexA.equals(vertexB)).toBe(true);
  });

  it("returns true for one vertex and one point sharing the same position", function () {
    const vertexA = new Vertex(0.25, -3, new Dcel());
    const pointA = new Vertex(0.25, -3, new Dcel());

    expect(pointA.equals(vertexA)).toBe(true);
  });
});
