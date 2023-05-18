import grahamScanConvexHull from "graham_scan";
import Point from "../../src/geometry/Point";

describe("ConvexHull()", function () {
  it("returns a convex hull on an array of point arrays", function () {
    const points = [
      [0, 0],
      [2, 0],
      [2, 2],
      [0, 2],
      [1, 1],
    ];
    const convexHull = new grahamScanConvexHull();
    points.forEach((p) => {
      convexHull.addPoint(p[0], p[1]);
    });
    const hullPoints = convexHull.getHull();
    expect(hullPoints.length).toBe(4);
  });
});

describe("ConvexHull()", function () {
  it("returns a convex hull on an array of points", function () {
    const points = [
      new Point(0, 0),
      new Point(2, 0),
      new Point(2, 2),
      new Point(0, 2),
      new Point(1, 1),
    ];
    const convexHull = new grahamScanConvexHull();
    points.forEach((p) => {
      convexHull.addPoint(p.x, p.y);
    });
    const hullPoints = convexHull.getHull();
    expect(hullPoints.length).toBe(4);
  });
});
