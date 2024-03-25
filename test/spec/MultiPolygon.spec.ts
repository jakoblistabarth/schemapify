import Polygon from "../../src/geometry/Polygon";
import Point from "../../src/geometry/Point";
import MultiPolygon from "../../src/geometry/MultiPolygon";

describe("The MultiPolygon's area getter", function () {
  it("gets the correct area of simple shapes", function () {
    const coordinates: [number, number][][][] = [
      [
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
      ],
      [
        [
          [-1, -1],
          [-2, -1],
          [-2, -2],
          [-1, -2],
        ],
      ],
    ];

    const pointsA = [
      new Point(0, 0),
      new Point(3, 0),
      new Point(3, 3),
      new Point(0, 3),
    ];
    const pointsB = [
      new Point(1, 1),
      new Point(2, 1),
      new Point(2, 2),
      new Point(1, 2),
    ];
    const pointsC = [
      new Point(-1, -1),
      new Point(-2, -1),
      new Point(-2, -2),
      new Point(-1, -2),
    ];
    const polygonA = new Polygon([pointsA, pointsB]);
    const polygonB = new Polygon([pointsC]);

    const multipolygon = new MultiPolygon([polygonA, polygonB]);

    expect(multipolygon.area).toBe(9);
    expect(MultiPolygon.fromCoordinates(coordinates).area).toBe(9);
    expect(multipolygon.polygons.length).toBe(2);
    expect(MultiPolygon.fromCoordinates(coordinates).polygons.length).toBe(2);
  });
});
