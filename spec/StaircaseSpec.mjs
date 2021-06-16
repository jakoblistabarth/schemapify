import Dcel from "../dist/cjs/lib/dcel/Dcel.js";
import C from "../dist/cjs/lib/OrientationRestriction/C.js";
import Vertex from "../dist/cjs/lib/dcel/Vertex.js";
import Point from "../dist/cjs/lib/Geometry/Point.js";
import Staircase from "../dist/cjs/lib/OrientationRestriction/Staircase.js";

describe("The Staircase class", function () {
  it("returns a Staircase region for an unaligned basic halfEdge", function () {
    const dcel = new Dcel();
    dcel.config = { C: new C(2) };

    const o = new Vertex(0, 0, dcel);
    const d = new Vertex(2, 2, dcel);
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
    dcel.config = { C: new C(2) };

    const o = new Vertex(0, 0, dcel);
    const d = new Vertex(-2, -2, dcel);
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
    dcel.config = { C: new C(2) };

    const o = new Vertex(0, 0, dcel);
    const d = new Vertex(-10, 2, dcel);
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

    const o = new Vertex(0, 0, dcel);
    const d = new Vertex(10, 10, dcel);
    const edge = dcel.makeHalfEdge(o, d);
    const twin = dcel.makeHalfEdge(d, o);
    edge.twin = twin;
    twin.twin = edge;
    edge.class = EDGE_CLASSES.AD;
    edge.assignedAngle = 0;
    edge.dcel = dcel;

    const staircase = new Staircase(edge);
    expect(staircase.points.length).toBe(7);
    expect(staircase.region.length).toBeLessThanOrEqual(staircase.points.length);
  });
});
