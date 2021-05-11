import DCEL from "../assets/lib/dcel/Dcel.mjs";
import HalfEdge from "../assets/lib/dcel/HalfEdge.mjs";
import Vertex from "../assets/lib/dcel/Vertex.mjs";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("getLength()", function () {
  it("returns the correct length", function () {
    const a = new Vertex(0, 0);
    const b = new Vertex(2, 0);
    const edge = new HalfEdge(a);
    edge.twin = new HalfEdge(b);
    edge.twin.twin = edge;

    expect(edge.getLength()).toEqual(2);
  });
});

describe("getMidpoint()", function () {
  it("returns the correct length", function () {
    const a = new Vertex(0, 0);
    const b = new Vertex(2, 0);
    const edge = new HalfEdge(a);
    edge.twin = new HalfEdge(b);
    edge.twin.twin = edge;

    const c = new Vertex(0, 10);
    const edge2 = new HalfEdge(a);
    edge2.twin = new HalfEdge(c);
    edge2.twin.twin = edge2;

    expect(edge.getMidpoint()).toEqual([1, 0]);
    expect(edge2.getMidpoint()).toEqual([0, 5]);
  });
});

describe("getAngle()", function () {
  it("returns the correct angle", function () {
    const center = new Vertex(0, 0);

    const headRight = new Vertex(4, 0);
    const edgeRight = new HalfEdge(center);
    edgeRight.twin = new HalfEdge(headRight);
    edgeRight.twin.twin = edgeRight;

    const headBottom = new Vertex(0, -1);
    const edgeBottom = new HalfEdge(center);
    edgeBottom.twin = new HalfEdge(headBottom);
    edgeBottom.twin.twin = edgeBottom;

    const headLeft = new Vertex(-20, 0);
    const edgeLeft = new HalfEdge(center);
    edgeLeft.twin = new HalfEdge(headLeft);
    edgeLeft.twin.twin = edgeLeft;

    const headTop = new Vertex(0, 100);
    const edgeTop = new HalfEdge(center);
    edgeTop.twin = new HalfEdge(headTop);
    edgeTop.twin.twin = edgeTop;

    expect(edgeRight.getAngle()).toBe(0);
    expect(edgeTop.getAngle()).toBe(Math.PI * 0.5);
    expect(edgeLeft.getAngle()).toBe(Math.PI);
    expect(edgeBottom.getAngle()).toBe(Math.PI * 1.5);
  });
});

describe("bisect()", function () {
  it("on one edge of a square results in 5 linked outer halfEdges", function () {
    const plgn1 = JSON.parse(
      readFileSync(resolve("assets/data/square.json"), "utf8")
    );
    const dcel = DCEL.buildFromGeoJSON(plgn1);
    dcel.getFaces()[1].edge.bisect();

    // expect(dcel.outerFace.getEdges().length).toBe(5)
    expect(dcel.getFaces()[1].edge.twin.face.getEdges().length).toBe(5);
    // expect(dcel.outerFace.getEdges(false).length).toBe(5)
    expect(dcel.getFaces()[1].edge.twin.face.getEdges(false).length).toBe(5);
  });

  it("on one edge of a square results in 5 linked inner halfEdges", function () {
    const plgn1 = JSON.parse(
      readFileSync(resolve("assets/data/square.json"), "utf8")
    );
    const dcel = DCEL.buildFromGeoJSON(plgn1);
    dcel.outerFace.edge.bisect();

    expect(dcel.getFaces()[1].getEdges().length).toBe(5);
    expect(dcel.outerFace.edge.twin.face.getEdges().length).toBe(5);
    expect(dcel.getFaces()[1].getEdges(false).length).toBe(5);
    expect(dcel.outerFace.edge.twin.face.getEdges(false).length).toBe(5);
  });
});
