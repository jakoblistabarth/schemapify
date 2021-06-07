import Line from "../assets/lib/Line.mjs";

describe("getPointOnLine", function () {
  it("returns a 2 point on a vertical line", function () {
    const a = new Line(0, 2, Math.PI * 0.5);
    expect(a.getPointOnLine(1)).toEqual([0, 3]);
  });

  it("returns a 2 point on a vertical line", function () {
    const a = new Line(0, 0, Math.PI * 1.5);
    expect(a.getPointOnLine(1)).toEqual([0, -1]);
  });

  it("returns a 2 point on a horizontal line", function () {
    const a = new Line(0, 0, Math.PI);
    expect(a.getPointOnLine(5)).toEqual([-5, 0]);
  });

  it("returns a 2 point on a horizontal line", function () {
    const a = new Line(0, 0, 0);
    expect(a.getPointOnLine(5)).toEqual([5, 0]);
  });

  it("returns a 2 point on a 45deg line", function () {
    const a = new Line(5, 5, Math.PI * 0.25);
    expect(a.getPointOnLine(Math.sqrt(2))).toEqual([6, 6]);
  });

  it("returns a 2 point on a 45deg line", function () {
    const a = new Line(5, 5, Math.PI * 0.75);
    expect(a.getPointOnLine(Math.sqrt(2))).toEqual([4, 6]);
  });
});

describe("intersectsLine()", function () {
  it("returns a vertex if 2 lines intersect", function () {
    const a = new Line(0, 0, Math.PI * 0.5);
    const b = new Line(2, 2, Math.PI);

    expect(a.intersectsLine(b)).toEqual([0, 2]);
  });

  it("returns a vertex if 2 lines intersect", function () {
    const a = new Line(-2, 0, Math.PI * 0.25);
    const b = new Line(0, -2, Math.PI * 0.75);

    expect(a.intersectsLine(b)).toEqual([-2, 0]);
  });

  it("returns a vertex if 2 lines intersect", function () {
    const a = new Line(-10, 0, 0);
    const b = new Line(0, 4, Math.PI * 1.5);

    expect(a.intersectsLine(b)).toEqual([0, 0]);
  });

  it("returns false for 2 parallel lines (no intersection point", function () {
    const a = new Line(0, 0, Math.PI * 0.5);
    const b = new Line(2, 2, Math.PI * 0.5);

    expect(a.intersectsLine(b)).toBe(false);
  });
});
