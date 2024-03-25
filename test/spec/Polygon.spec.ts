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
    expect(
      Polygon.fromCoordinates([
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
        ],
      ]).area,
    ).toBe(1);
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
    expect(
      Polygon.fromCoordinates([
        [
          [0, 0],
          [3, 0],
          [3, 3],
          [0, 3],
        ],
        [
          [1, 1],
          [2, 1],
          [2, 2],
          [1, 2],
        ],
      ]).area,
    ).toBe(8);
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

describe("A polygon created from a set of coordinates", function () {
  it("without holes is correct", function () {
    const p = Polygon.fromCoordinates([
      [
        [2, 2],
        [3, 2],
        [3, 3],
        [2, 3],
      ],
    ]);
    expect(p).toBeInstanceOf(Polygon);
    expect(p.interiorRings.length).toEqual(0);
    expect(p.area).toEqual(1);
  });
  it("with holes is correct", function () {
    const p = Polygon.fromCoordinates([
      [
        [0, 0],
        [5, 0],
        [3, 3],
        [0, 5],
      ],
      [
        [1, 1],
        [2, 1],
        [2, 2],
        [1, 2],
      ],
      [
        [3, 3],
        [4, 3],
        [4, 4],
        [3, 4],
      ],
    ]);
    expect(p).toBeInstanceOf(Polygon);
    expect(p.area).toEqual(13);
    expect(p.exteriorRing[0]).toEqual(new Point(0, 0));
    expect(p.interiorRings.length).toEqual(2);
    expect(p.interiorRings[0][0]).toBeInstanceOf(Point);
    expect(p.interiorRings[0][0]).toEqual(new Point(1, 1));
  });
});
