import Ring from "@/src/geometry/Ring";

describe("isClockwise() returns the correct boolean", function () {
  it("for simple squares", function () {
    const points: [number, number][] = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];

    expect(Ring.fromCoordinates(points).isClockwise).toBeFalsy();
    expect(
      Ring.fromCoordinates([...points].reverse()).isClockwise,
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

describe("reverse() revers the order of a", function () {
  it("counterclockwise ring", function () {
    const r = Ring.fromCoordinates([
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ]);

    expect(r.reverse().isClockwise).toBeTruthy();
  });
  it("clockwise ring", function () {
    const r = Ring.fromCoordinates([
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 0],
    ]);

    expect(r.reverse().isClockwise).toBeFalsy();
  });

  it("a concave ring", function () {
    const r = Ring.fromCoordinates([
      [0, 0],
      [1, 0],
      [1, 1],
      [0.5, 0.5],
      [0, 1],
    ]);

    expect(r.reverse().isClockwise).toBeTruthy();
  });
});
