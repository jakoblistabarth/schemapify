import Point from "../assets/lib/Geometry/Point";
import { getPolygonArea } from "../assets/lib/utilities";

describe("distanceToPoint()", function () {
  it("returns the correct distance between 2 vertices", function () {
    const a = new Point(0, 0);
    const b = new Point(4, 0);
    const c = new Point(4, 4);
    const d = new Point(-4, -4);

    expect(b.distanceToPoint(a)).toEqual(b.distanceToPoint(a));
    expect(a.distanceToPoint(b)).toEqual(4);
    expect(a.distanceToPoint(c)).toEqual(Math.sqrt(4 * 4 + 4 * 4));
    expect(d.distanceToPoint(a)).toEqual(Math.sqrt(-4 * -4 + -4 * -4));
  });
});

describe("isInPolygon()", function () {
  it("returns false if it lies outside of a convex(!) Polygon", function () {
    const A = [new Point(0, 0), new Point(0, 1), new Point(1, 1), new Point(1, 0)];
    const B = [new Point(-5, -5), new Point(5, -5), new Point(5, 10), new Point(-5, 10)];

    const a = new Point(100, 100);
    const b = new Point(-1, -1);
    const c = new Point(1.1, 0);

    expect(a.isInPolygon(A)).toBeFalse();
    expect(a.isInPolygon(B)).toBeFalse();
    expect(b.isInPolygon(A)).toBeFalse();
    expect(c.isInPolygon(A)).toBeFalse();
  });

  it("returns true if it lies inside of a convex(!) Polygon", function () {
    const A = [new Point(0, 0), new Point(0, 1), new Point(1, 1), new Point(1, 0)];
    const B = [new Point(-5, -5), new Point(5, -5), new Point(5, 10), new Point(-5, 10)];
    const a = new Point(0.5, 0.5);
    const b = new Point(0, 1);
    const c = new Point(0.5, 0);
    const d = new Point(-2.5, -2.5);

    expect(a.isInPolygon(A)).toBeTrue();
    expect(b.isInPolygon(A)).toBeTrue();
    expect(c.isInPolygon(A)).toBeTrue();
    expect(d.isInPolygon(B)).toBeTrue();
  });
});

describe("getPolygonArea()", function () {
  it("returns correct area for a given set of 4 Points (a square)", function () {
    const points = [new Point(0, 0), new Point(0, 1), new Point(1, 1), new Point(1, 0)];
    expect(getPolygonArea(points)).toBe(1);
  });

  it("returns correct area for a given set of 3 Points (a triangle)", function () {
    const points = [new Point(0, 0), new Point(0, 1), new Point(1, 1)];
    expect(getPolygonArea(points)).toBe(0.5);
  });
});
