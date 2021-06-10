import Dcel from "../assets/lib/dcel/Dcel.mjs";
import C from "../assets/lib/orientation-restriction/C.mjs";
import { EDGE_CLASSES } from "../assets/lib/dcel/HalfEdge.mjs";
import Vertex from "../assets/lib/dcel/Vertex.mjs";
import Point from "../assets/lib/Point.mjs";
import Staircase from "../assets/lib/Staircase.mjs";

describe("The Staircase class", function () {
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
      new Point(0, 0),
      new Point(2, 0),
      new Point(2, 2),
      new Point(0, 2),
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
      new Point(0, 0),
      new Point(-2, 0),
      new Point(-2, -2),
      new Point(0, -2),
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
      new Point(0, 0),
      new Point(0, 2),
      new Point(-10, 2),
      new Point(-10, 0),
    ]);
  });
});

describe("buildStaircaseAD", function () {
  it("returns a Staircase for an unaligned deviating halfEdge with 7 Vertices", function () {
    const dcel = new Dcel();
    dcel.config = { C: new C(4) };

    const o = new Vertex(0, 0);
    const d = new Vertex(10, 10);
    const edge = dcel.makeHalfEdge(o, d);
    const twin = dcel.makeHalfEdge(d, o);
    edge.twin = twin;
    twin.twin = edge;
    edge.class = EDGE_CLASSES.AD;
    edge.assignedAngle = 0;
    edge.dcel = dcel;

    const staircase = new Staircase(edge);
    expect(staircase.stepPoints.length).toBe(7);
    expect(staircase.region.length).toBeLessThanOrEqual(staircase.stepPoints.length);
  });
});
