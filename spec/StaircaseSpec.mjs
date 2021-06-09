import Dcel from "../assets/lib/dcel/Dcel.mjs";
import { EDGE_CLASSES } from "../assets/lib/dcel/HalfEdge.mjs";
import Vertex from "../assets/lib/dcel/Vertex.mjs";
import Staircase from "../assets/lib/Staircase.mjs";

describe("getPointOnLine", function () {
  it("returns a Staircase region for an unaligned basic halfEdge", function () {
    const dcel = new Dcel();
    const o = new Vertex(0, 0);
    const d = new Vertex(2, 2);
    const edge = dcel.makeHalfEdge(o, d);
    const twin = dcel.makeHalfEdge(d, o);
    edge.twin = twin;
    twin.twin = edge;
    edge.class = EDGE_CLASSES.UB;

    const staircase = new Staircase(edge);
    expect(staircase.region).toEqual([
      [0, 0],
      [2, 0],
      [2, 2],
      [0, 2],
    ]);
  });

  it("returns a Staircase region for an unaligned basic halfEdge", function () {
    const dcel = new Dcel();
    const o = new Vertex(0, 0);
    const d = new Vertex(-2, -2);
    const edge = dcel.makeHalfEdge(o, d);
    const twin = dcel.makeHalfEdge(d, o);
    edge.twin = twin;
    twin.twin = edge;
    edge.class = EDGE_CLASSES.UB;

    const staircase = new Staircase(edge);
    expect(staircase.region).toEqual([
      [0, 0],
      [-2, 0],
      [-2, -2],
      [0, -2],
    ]);
  });

  it("returns a Staircase region for an unaligned basic halfEdge", function () {
    const dcel = new Dcel();
    const o = new Vertex(0, 0);
    const d = new Vertex(-10, 2);
    const edge = dcel.makeHalfEdge(o, d);
    const twin = dcel.makeHalfEdge(d, o);
    edge.twin = twin;
    twin.twin = edge;
    edge.class = EDGE_CLASSES.UB;

    const staircase = new Staircase(edge);
    expect(staircase.region).toEqual([
      [0, 0],
      [0, 2],
      [-10, 2],
      [-10, 0],
    ]);
  });
});
