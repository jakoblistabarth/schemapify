import Ring from "../../src/geometry/Ring";

describe("isClockwise() returns the correct boolean", function () {
  it("for simple squares", function () {
    const points: [number, number][] = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];

    expect(Ring.fromCoordinates(points).isClockwise).toEqual(false);
    expect(Ring.fromCoordinates([...points].reverse()).isClockwise).toEqual(
      true,
    );
  });

  it("for concave shapes", function () {
    const points: [number, number][] = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0.5, 0.5],
      [0, 1],
    ];

    expect(Ring.fromCoordinates(points).isClockwise).toEqual(false);
    expect(Ring.fromCoordinates([...points].reverse()).isClockwise).toEqual(
      true,
    );
  });
});

describe("reverse() revers the order of a", function () {
  it("clockwise ring", function () {
    const r = Ring.fromCoordinates([
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ]);

    expect(r.reverse().isClockwise).toEqual(true);
  });
  it("counterclockwise ring", function () {
    const r = Ring.fromCoordinates([
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 0],
    ]);

    expect(r.reverse().isClockwise).toEqual(false);
  });

  it("a concave ring", function () {
    const r = Ring.fromCoordinates([
      [0, 0],
      [1, 0],
      [1, 1],
      [0.5, 0.5],
      [0, 1],
    ]);

    expect(r.reverse().isClockwise).toEqual(true);
  });
});
