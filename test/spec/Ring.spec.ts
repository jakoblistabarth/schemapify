import Ring from "@/src/geometry/Ring";

describe("isClockwise() returns the correct boolean", function () {
  it("for simple squares", function () {
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

    expect(Ring.fromCoordinates(clockwise).isClockwise).toBeTruthy();
    expect(Ring.fromCoordinates(counterclockwise).isClockwise).toBeFalsy();
    expect(
      Ring.fromCoordinates([...counterclockwise].reverse()).isClockwise,
    ).toBeTruthy();
  });

  it("for a triangle", function () {
    const points: [number, number][] = [
      [0, 0],
      [3, 5],
      [1, 3],
    ];

    expect(Ring.fromCoordinates(points).isClockwise).toBeFalsy();
    expect(
      Ring.fromCoordinates([...points].reverse()).isClockwise,
    ).toBeTruthy();
  });

  it("for a triangle", function () {
    const points: [number, number][] = [
      [0, 0],
      [4, 0],
      [0, 4],
    ];

    expect(Ring.fromCoordinates(points).isClockwise).toBeFalsy();
  });

  it("for a triangle", function () {
    const points: [number, number][] = [
      [15.99, 46.83],
      [17.07, 48.11],
      [16.17, 47.42],
    ];

    const ring = Ring.fromCoordinates(points);

    expect(ring.isClockwise).toBeFalsy();
    expect(
      Ring.fromCoordinates([...points].reverse()).isClockwise,
    ).toBeTruthy();
  });

  it("for concave shapes", function () {
    const points: [number, number][] = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0.5, 0.5],
      [0, 1],
    ];

    expect(Ring.fromCoordinates(points).isClockwise).toBeFalsy();
    expect(
      Ring.fromCoordinates([...points].reverse()).isClockwise,
    ).toBeTruthy();
  });
});

describe("The first and last point are the same", function () {
  it("for a simple square.", function () {
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
