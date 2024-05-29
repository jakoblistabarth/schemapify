import Line from "@/src/geometry/Line";
import Point from "@/src/geometry/Point";

describe("getPointOnLine()", function () {
  it("returns a 2 point on a vertical line", function () {
    const a = new Line(new Point(0, 2), Math.PI * 0.5);
    expect(a.getPointOnLine(1).xy).toEqual([0, 3]);
  });

  it("returns a 2 point on a vertical line", function () {
    const a = new Line(new Point(0, 0), Math.PI * 1.5);
    expect(a.getPointOnLine(1).xy).toEqual([0, -1]);
  });

  it("returns a 2 point on a horizontal line", function () {
    const a = new Line(new Point(0, 0), Math.PI);
    expect(a.getPointOnLine(5).xy).toEqual([-5, 0]);
  });

  it("returns a 2 point on a horizontal line", function () {
    const a = new Line(new Point(0, 0), 0);
    expect(a.getPointOnLine(5).xy).toEqual([5, 0]);
  });

  it("returns a 2 point on a 45deg line", function () {
    const a = new Line(new Point(5, 5), Math.PI * 0.25);
    expect(a.getPointOnLine(Math.sqrt(2)).xy).toEqual([6, 6]);
  });

  it("returns a 2 point on a 45deg line", function () {
    const a = new Line(new Point(5, 5), Math.PI * 0.75);
    expect(a.getPointOnLine(Math.sqrt(2)).xy).toEqual([4, 6]);
  });
});

describe("intersectsLine()", function () {
  it("returns a vertex if 2 lines intersect", function () {
    const a = new Line(new Point(0, 0), Math.PI * 0.5);
    const b = new Line(new Point(2, 2), Math.PI);

    expect(a.intersectsLine(b)?.xy).toEqual([0, 2]);
  });

  it("returns a vertex if 2 lines intersect", function () {
    const a = new Line(new Point(-2, 0), Math.PI * 0.25);
    const b = new Line(new Point(0, -2), Math.PI * 0.75);

    expect(a.intersectsLine(b)?.xy).toEqual([-2, 0]);
  });

  it("returns a vertex if 2 lines intersect", function () {
    const a = new Line(new Point(-10, 0), 0);
    const b = new Line(new Point(0, 4), Math.PI * 1.5);

    expect(a.intersectsLine(b)?.xy).toEqual([0, 0]);
  });

  it("returns false for 2 parallel lines (no intersection point", function () {
    const a = new Line(new Point(0, 0), Math.PI * 0.5);
    const b = new Line(new Point(2, 2), Math.PI * 0.5);

    expect(a.intersectsLine(b)).toBe(undefined);
  });
});
