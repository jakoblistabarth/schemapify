import Point from "@/src/geometry/Point";
import Ring from "@/src/geometry/Ring";
import { describe, expect, test } from "vitest";

describe("isClockwise() returns the correct boolean", function () {
  test("for simple squares", function () {
    const counterclockwise: [number, number][] = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];

    const clockwise: [number, number][] = [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 0],
    ];

    expect(Ring.fromCoordinates(clockwise).isClockwise).toBe(true);
    expect(Ring.fromCoordinates(counterclockwise).isClockwise).toBe(false);
    expect(
      Ring.fromCoordinates([...counterclockwise].reverse()).isClockwise,
    ).toBe(true);
  });

  test("for a triangle", function () {
    const points: [number, number][] = [
      [0, 0],
      [3, 5],
      [1, 3],
    ];

    expect(Ring.fromCoordinates(points).isClockwise).toBe(false);
    expect(Ring.fromCoordinates([...points].reverse()).isClockwise).toBe(true);
  });

  test("for a triangle", function () {
    const points: [number, number][] = [
      [0, 0],
      [4, 0],
      [0, 4],
    ];

    expect(Ring.fromCoordinates(points).isClockwise).toBe(false);
  });

  test("for a triangle", function () {
    const points: [number, number][] = [
      [15.99, 46.83],
      [17.07, 48.11],
      [16.17, 47.42],
    ];

    const ring = Ring.fromCoordinates(points);

    expect(ring.isClockwise).toBe(false);
    expect(Ring.fromCoordinates([...points].reverse()).isClockwise).toBe(true);
  });

  test("for concave shapes", function () {
    const points: [number, number][] = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0.5, 0.5],
      [0, 1],
    ];

    expect(Ring.fromCoordinates(points).isClockwise).toBe(false);
    expect(Ring.fromCoordinates([...points].reverse()).isClockwise).toBe(true);
  });
});

describe("The first and last point are the same", function () {
  test("for a simple square.", function () {
    const points: [number, number][] = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];

    const ring = Ring.fromCoordinates(points);

    expect(ring.points.length).toBe(5);
    expect(ring.points.at(0)?.xy).toEqual(ring.points.at(-1)?.xy);
  });
});

describe("Constructing a Ring", function () {
  test("leaves the points which were passed in untouched.", function () {
    const points = [
      new Point(0, 0),
      new Point(1, 0),
      new Point(1, 1),
      new Point(0, 1),
    ];

    const ring = new Ring(points);

    // Callers reuse their array, so closing the ring must not append to it.
    expect(points.length).toBe(4);
    expect(ring.points.length).toBe(5);
  });
});
