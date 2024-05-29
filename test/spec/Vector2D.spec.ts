import Vector2D from "@/src/geometry/Vector2D";

describe("dot() returns the correct scalar", function () {
  it("for 2 simple vectors", function () {
    const a = new Vector2D(0, 2);
    const b = new Vector2D(4, 2);

    expect(a.dot(b)).toEqual(b.dot(a));
    expect(a.dot(b)).toBe(4);
  });

  it("for 2 simple vectors", function () {
    const a = new Vector2D(1, 2);
    const b = new Vector2D(2, 1);

    expect(a.dot(b)).toEqual(b.dot(a));
    expect(a.dot(b)).toBe(4);
  });

  it("for 2 simple vectors", function () {
    const a = new Vector2D(-2, 4);
    const b = new Vector2D(6, -3);

    expect(a.dot(b)).toEqual(b.dot(a));
    expect(a.dot(b)).toBe(-24);
  });
});

describe("The getter invers() returns the correct inverted vector", function () {
  it("for a simple vector", function () {
    expect(new Vector2D(2, 0).invers).toEqual(new Vector2D(-2, -0));
    expect(new Vector2D(-1, -5).invers).toEqual(new Vector2D(1, 5));
    expect(new Vector2D(-1, 5).invers).toEqual(new Vector2D(1, -5));
    expect(new Vector2D(1, 5).invers).toEqual(new Vector2D(-1, -5));
  });
});

describe("times() returns the correct vector", function () {
  it("for a simple vector", function () {
    expect(new Vector2D(2, 0).times(2)).toEqual(new Vector2D(4, 0));
    expect(new Vector2D(3, -1).times(2)).toEqual(new Vector2D(6, -2));
    expect(new Vector2D(3, 5).times(-2)).toEqual(new Vector2D(-6, -10));
  });
});

describe("The getter unitVector() returns the correct vector", function () {
  it("for a simple vector", function () {
    expect(new Vector2D(2, 0).unitVector).toEqual(new Vector2D(1, 0));
    expect(new Vector2D(-2, 0).unitVector).toEqual(new Vector2D(-1, 0));
    expect(new Vector2D(2, 4).unitVector.dx).toBeCloseTo(0.44721);
    expect(new Vector2D(2, 4).unitVector.dy).toBeCloseTo(0.89443);
  });
});
