import LineSegment from "@/src/geometry/LineSegment";
import Point from "@/src/geometry/Point";
import Polygon from "@/src/geometry/Polygon";
import Ring from "@/src/geometry/Ring";
import { describe, expect, test } from "vitest";

describe("The Polygon's area getter", function () {
  test("gets the correct area of simple squares", function () {
    const ringA = new Ring([
      new Point(0, 0),
      new Point(4, 0),
      new Point(4, 4),
      new Point(0, 4),
    ]);
    const ringB = new Ring([
      new Point(-2, -2),
      new Point(2, -2),
      new Point(2, 2),
      new Point(-2, 2),
    ]);
    const ringC = new Ring([
      new Point(0, -1),
      new Point(1, 0),
      new Point(0, 1),
      new Point(-1, 0),
    ]);
    const polygonA = new Polygon([ringA]);
    const polygonB = new Polygon([ringB]);
    const polygonC = new Polygon([ringC]);

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

  test("gets the correct area of shapes with holes", function () {
    const exteriorRing = new Ring([
      new Point(0, 0),
      new Point(4, 0),
      new Point(4, 4),
      new Point(0, 4),
    ]);
    const interiorRing = new Ring([
      new Point(0.5, 0.5),
      new Point(1.5, 0.5),
      new Point(1.5, 1.5),
      new Point(0.5, 1.5),
    ]);

    const polygonA = new Polygon([exteriorRing, interiorRing]);

    const polygonB = new Polygon([
      exteriorRing,
      interiorRing,
      new Ring(interiorRing.points.map((p) => new Point(p.x + 2, p.y + 2))),
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
  test("gets the line segments of simple squares", function () {
    const polygon = Polygon.fromCoordinates([
      [
        [0, -1],
        [1, 0],
        [0, 1],
        [-1, 0],
      ],
    ]);

    expect(polygon.exteriorLineSegments).toEqual([
      new LineSegment(new Point(0, -1), new Point(1, 0)),
      new LineSegment(new Point(1, 0), new Point(0, 1)),
      new LineSegment(new Point(0, 1), new Point(-1, 0)),
      new LineSegment(new Point(-1, 0), new Point(0, -1)),
    ]);
  });
});

describe("A polygon created from a set of coordinates", function () {
  test("without holes is correct", function () {
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
  test("with holes is correct", function () {
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
    expect(p.exteriorRing.points[0]).toEqual(new Point(0, 0));
    expect(p.interiorRings.length).toEqual(2);
    expect(p.interiorRings[0].points[0]).toBeInstanceOf(Point);
    expect(p.interiorRings[0].points[0]).toEqual(new Point(1, 1));
  });
});

describe("Polygon.fromUnorderedCoordinates", function () {
  /** A square, wound clockwise, as a file format may well store it. */
  const clockwise: [number, number][] = [
    [0, 0],
    [0, 2],
    [2, 2],
    [2, 0],
  ];

  test("stores a clockwise ring counterclockwise, so no read has to reverse it.", function () {
    const polygon = Polygon.fromUnorderedCoordinates([clockwise]);

    expect(polygon.exteriorRing.isClockwise).toBe(false);
    expect(polygon.exteriorRing._points.map((point) => point.xy)).toEqual([
      [0, 0],
      [2, 0],
      [2, 2],
      [0, 2],
      [0, 0],
    ]);
  });

  test("leaves a counterclockwise ring as it is, and closes it.", function () {
    const counterclockwise = clockwise.toReversed();
    const polygon = Polygon.fromUnorderedCoordinates([counterclockwise]);

    expect(polygon.exteriorRing.toCoordinates()).toEqual([
      ...counterclockwise,
      counterclockwise[0],
    ]);
  });

  test("keeps the closing point from being stored twice.", function () {
    const closed = [...clockwise, clockwise[0]];

    expect(Polygon.fromUnorderedCoordinates([closed]).exteriorRing.length).toBe(
      Polygon.fromUnorderedCoordinates([clockwise]).exteriorRing.length,
    );
  });
});
