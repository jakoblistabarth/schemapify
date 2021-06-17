import fs from "fs";
import path from "path";
import Vertex from "../assets/lib/dcel/Vertex";
import HalfEdge from "../assets/lib/dcel/Halfedge";
import Dcel from "../assets/lib/dcel/Dcel";
import { getTestFiles } from "./test-setup";

describe("distanceToVertex()", function () {
  it("returns the correct distance between 2 vertices", function () {
    const a = new Vertex(0, 0, null);
    const b = new Vertex(4, 0, null);
    const c = new Vertex(4, 4, null);
    const d = new Vertex(-4, -4, null);

    expect(b.distanceToVertex(a)).toEqual(b.distanceToVertex(a));
    expect(a.distanceToVertex(b)).toEqual(4);
    expect(a.distanceToVertex(c)).toEqual(Math.sqrt(4 * 4 + 4 * 4));
    expect(d.distanceToVertex(a)).toEqual(Math.sqrt(-4 * -4 + -4 * -4));
  });
});

describe("distanceToEdge()", function () {
  it("returns the minimum distance between a vertex and an edge", function () {
    const a = new Vertex(0, 0, null);
    const v = new Vertex(-1, -2, null);
    const w = new Vertex(2, 1, null);

    const edge = new HalfEdge(v, null);
    edge.twin = new HalfEdge(w, null);
    edge.twin.twin = edge;

    expect(a.distanceToEdge(edge)).toEqual(Math.sqrt(0.5));
    expect(v.distanceToEdge(edge)).toEqual(0);
  });
});

describe("sortEdges()", function () {
  // TODO: use before each to test more cases based on the same 4 edges

  it("sorts 4 radial edges in clockwise order", function () {
    const center = new Vertex(0, 0, null);

    const headRight = new Vertex(4, 0, null);
    const edgeRight = new HalfEdge(center, null);
    edgeRight.twin = new HalfEdge(headRight, null);
    edgeRight.twin.twin = edgeRight;

    const headBottom = new Vertex(0, -1, null);
    const edgeBottom = new HalfEdge(center, null);
    edgeBottom.twin = new HalfEdge(headBottom, null);
    edgeBottom.twin.twin = edgeBottom;

    const headLeft = new Vertex(-20, 0, null);
    const edgeLeft = new HalfEdge(center, null);
    edgeLeft.twin = new HalfEdge(headLeft, null);
    edgeLeft.twin.twin = edgeLeft;

    const headTop = new Vertex(0, 100, null);
    const edgeTop = new HalfEdge(center, null);
    edgeTop.twin = new HalfEdge(headTop, null);
    edgeTop.twin.twin = edgeTop;

    center.edges.push(edgeRight, edgeLeft, edgeBottom, edgeTop);
    center.sortEdges();

    expect(center.edges).toEqual([edgeBottom, edgeLeft, edgeTop, edgeRight]);
  });

  it("sorts outgoing edges of all vertices in clockwise order", function () {
    const dir = "assets/data/shapes";
    const testFiles = getTestFiles(dir);

    testFiles.forEach((file) => {
      const json = JSON.parse(fs.readFileSync(path.resolve(dir + "/" + file), "utf8"));
      let dcel = Dcel.fromGeoJSON(json);

      dcel.vertices.forEach((vertex) => {
        const angles = vertex.edges.map((e) => e.getAngle());
        expect(angles.every((v, i, a) => !i || a[i - 1] >= v)).toEqual(true);
      });
    });
  });
});
