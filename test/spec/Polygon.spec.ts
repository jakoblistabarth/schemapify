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
    const polygonA = new Polygon([pointsA]);
    const polygonB = new Polygon([pointsB]);
    const polygonC = new Polygon([pointsC]);

    expect(polygonA.area).toBe(16);
    expect(polygonB.area).toBe(16);
    expect(polygonC.area).toBe(2);
  });

  it("gets the correct area of shapes with holes", function () {
    const pointsA = [
      new Point(0, 0),
      new Point(4, 0),
      new Point(4, 4),
      new Point(0, 4),
    ];
    const pointsHole = [
      new Point(0.5, 0.5),
      new Point(1.5, 0.5),
      new Point(1.5, 1.5),
      new Point(0.5, 1.5),
    ];

    const polygonA = new Polygon([pointsA, pointsHole]);

    const polygonB = new Polygon([
      pointsA,
      pointsHole,
      pointsHole.map((p) => new Point(p.x + 2, p.y + 2)),
    ]);

    expect(polygonA.area).toBe(15);
    expect(polygonB.area).toBe(14);
  });
});

describe("The Polygon's exteriorLineSegments getter", function () {
  it("gets the line segments of simple squares", function () {
    const points = [
      new Point(0, -1),
      new Point(1, 0),
      new Point(0, 1),
      new Point(-1, 0),
    ];
    const polygon = new Polygon([points]);

    expect(polygon.exteriorLineSegments).toEqual([
      new LineSegment(new Point(0, -1), new Point(1, 0)),
      new LineSegment(new Point(1, 0), new Point(0, 1)),
      new LineSegment(new Point(0, 1), new Point(-1, 0)),
      new LineSegment(new Point(-1, 0), new Point(0, -1)),
    ]);
  });
});
