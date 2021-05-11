import Vertex from "../assets/lib/dcel/Vertex.mjs";
import HalfEdge from "../assets/lib/dcel/Halfedge.mjs";

describe("getDistance()", function () {
  it("returns the correct distance between 2 points", function () {
    const a = new Vertex(0, 0);
    const b = new Vertex(4, 0);
    const c = new Vertex(4, 4);
    const d = new Vertex(-4, -4);

    expect(b.getDistance(a)).toEqual(b.getDistance(a));
    expect(a.getDistance(b)).toEqual(4);
    expect(a.getDistance(c)).toEqual(Math.sqrt(4 * 4 + 4 * 4));
    expect(d.getDistance(a)).toEqual(Math.sqrt(-4 * -4 + -4 * -4));
  });
});

describe("sortEdges()", function () {
  // TODO: use before each to test more cases based on the same 4 edges

  it("sorts edges in clockwise order", function () {
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

    center.edges.push(edgeRight, edgeLeft, edgeBottom, edgeTop);
    center.sortEdges();

    expect(center.edges).toEqual([edgeBottom, edgeLeft, edgeTop, edgeRight]);
  });
});
