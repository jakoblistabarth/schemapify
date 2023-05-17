import Polygon from "../../src/geometry/Polygon";
import Point from "../../src/geometry/Point";
import LineSegment from "../../src/geometry/LineSegment";

describe("getArea()", function () {
  it("gets the correct area of simple squares", function () {
    const pointsA = [new Point(0, 0), new Point(4, 0), new Point(4, 4), new Point(0, 4)];
    const pointsB = [new Point(-2, -2), new Point(2, -2), new Point(2, 2), new Point(-2, 2)];
    const pointsC = [new Point(0, -1), new Point(1, 0), new Point(0, 1), new Point(-1, 0)];
    const polygonA = new Polygon(pointsA);
    const polygonB = new Polygon(pointsB);
    const polygonC = new Polygon(pointsC);

    expect(polygonA.getArea()).toBe(16);
    expect(polygonB.getArea()).toBe(16);
    expect(polygonC.getArea()).toBe(2);
  });
});

describe("getLineSegements()", function () {
  it("gets the line segements area of simple squares", function () {
    const points = [new Point(0, -1), new Point(1, 0), new Point(0, 1), new Point(-1, 0)];
    const polygon = new Polygon(points);

    expect(polygon.getLineSegments()).toEqual([
      new LineSegment(new Point(0, -1), new Point(1, 0)),
      new LineSegment(new Point(1, 0), new Point(0, 1)),
      new LineSegment(new Point(0, 1), new Point(-1, 0)),
      new LineSegment(new Point(-1, 0), new Point(0, -1)),
    ]);
  });
});
