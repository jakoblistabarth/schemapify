import Polygon from "../../src/geometry/Polygon";
import Point from "../../src/geometry/Point";
import LineSegment from "../../src/geometry/LineSegment";

describe("The Polygon's area getter", function () {
  it("gets the correct area of simple squares", function () {
    const pointsA = [
      new Point(0, 0),
      new Point(4, 0),
      new Point(4, 4),
      new Point(0, 4),
    ];
    const pointsB = [
      new Point(-2, -2),
      new Point(2, -2),
      new Point(2, 2),
      new Point(-2, 2),
    ];
    const pointsC = [
      new Point(0, -1),
      new Point(1, 0),
      new Point(0, 1),
      new Point(-1, 0),
    ];
    const polygonA = new Polygon(pointsA);
    const polygonB = new Polygon(pointsB);
    const polygonC = new Polygon(pointsC);

    expect(polygonA.area).toBe(16);
    expect(polygonB.area).toBe(16);
    expect(polygonC.area).toBe(2);
  });
});

describe("The Polygon#s lineSegments getter", function () {
  it("gets the line segments of simple squares", function () {
    const points = [
      new Point(0, -1),
      new Point(1, 0),
      new Point(0, 1),
      new Point(-1, 0),
    ];
    const polygon = new Polygon(points);

    expect(polygon.lineSegments).toEqual([
      new LineSegment(new Point(0, -1), new Point(1, 0)),
      new LineSegment(new Point(1, 0), new Point(0, 1)),
      new LineSegment(new Point(0, 1), new Point(-1, 0)),
      new LineSegment(new Point(-1, 0), new Point(0, -1)),
    ]);
  });
});
