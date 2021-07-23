import Point from "../src/lib/geometry/Point";
import LineSegment from "../src/lib/geometry/LineSegment";

describe("intersectsLineSegment()", function () {
  it("returns intersection point if two line segments share an endpoint (no matter whether or not collinearity is considered).", function () {
    const a = new LineSegment(new Point(0, 0), new Point(2, 2));
    const b = new LineSegment(new Point(2, 2), new Point(4, 2));
    expect(a.intersectsLineSegment(b)).toEqual(new Point(2, 2));
    expect(a.intersectsLineSegment(b, true)).toEqual(new Point(2, 2));
  });

  it("returns a point with NANs if two line segments overlap and collinear overlap is considered, and returns undefined if not considered.", function () {
    const a = new LineSegment(new Point(-1, -1), new Point(1, 1));
    const b = new LineSegment(new Point(-2, -2), new Point(2, 2));
    expect(a.intersectsLineSegment(b, true)).toEqual(new Point(NaN, NaN));
    expect(a.intersectsLineSegment(b)).toBeUndefined();
  });

  it("returns an intersection point if two line segments share an endpoint (no matter whether or not collinearity is considered).", function () {
    const a = new LineSegment(new Point(0, 0), new Point(2, 2));
    const b = new LineSegment(new Point(2, 2), new Point(4, 2));
    expect(a.intersectsLineSegment(b, true)).toEqual(new Point(2, 2));
    expect(a.intersectsLineSegment(b)).toEqual(new Point(2, 2));
  });

  it("returns the intersectionpoint if two line intersects each other.", function () {
    const a = new LineSegment(new Point(0, 0), new Point(5, 5));
    const b = new LineSegment(new Point(0, 5), new Point(5, 0));
    const c = new LineSegment(new Point(-2, -2), new Point(2, 2));
    const d = new LineSegment(new Point(2, -2), new Point(-2, 2));

    expect(a.intersectsLineSegment(b)).toEqual(new Point(2.5, 2.5));
    expect(c.intersectsLineSegment(d)).toEqual(new Point(0, 0));
  });

  it("returns a Point with NaNs if two line segments are collinear and collinearity is considered, and returns undefined if not considered.", function () {
    const a = new LineSegment(new Point(0, 0), new Point(2, 2));
    const b = new LineSegment(new Point(2, 2), new Point(4, 4));
    expect(a.intersectsLineSegment(b, true)).toEqual(new Point(NaN, NaN));
    expect(a.intersectsLineSegment(b)).toBeUndefined();
  });
});
