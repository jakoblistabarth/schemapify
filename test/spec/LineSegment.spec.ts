import Point from "../../src/geometry/Point";
import LineSegment from "../../src/geometry/LineSegment";
import Polygon from "../../src/geometry/Polygon";

describe("intersectsLineSegment()", function () {
  it("returns intersection point if two line segments share an endpoint (no matter whether or not collinearity is considered).", function () {
    const a = new LineSegment(new Point(0, 0), new Point(2, 2));
    const b = new LineSegment(new Point(2, 2), new Point(4, 2));
    expect(a.intersectsLineSegment(b, true)).toEqual(new Point(2, 2));
    expect(a.intersectsLineSegment(b)).toEqual(new Point(2, 2));
  });

  it("returns a point with NANs if two line segments overlap and collinear overlap is considered, and returns undefined if not considered.", function () {
    const a = new LineSegment(new Point(-1, -1), new Point(1, 1));
    const b = new LineSegment(new Point(-2, -2), new Point(2, 2));
    expect(a.intersectsLineSegment(b, true)).toEqual(new Point(NaN, NaN));
    expect(a.intersectsLineSegment(b)).toBeUndefined();
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

describe("intersectsPolygon()", function () {
  it("returns the expected intersection points for a linesegment going through the polygon", function () {
    const segmentA = new LineSegment(new Point(-2, 2), new Point(8, 2));
    const segmentB = new LineSegment(new Point(-4, 0), new Point(8, 6));
    const polygon = Polygon.fromCoordinates([
      [
        [0, 0],
        [4, 0],
        [8, 4],
        [0, 4],
      ],
    ]);

    expect(segmentA.intersectsPolygon(polygon)).toEqual([
      new Point(6, 2),
      new Point(0, 2),
    ]);
    expect(segmentB.intersectsPolygon(polygon)).toEqual([
      new Point(4, 4),
      new Point(0, 2),
    ]);
  });

  it("returns the expected intersection points for a linesegment which ends/starts on the polygon boundary", function () {
    const segment = new LineSegment(new Point(-4, 0), new Point(0, 0));
    const polygon = Polygon.fromCoordinates([
      [
        [0, 0],
        [4, 0],
        [4, 4],
        [0, 4],
      ],
    ]);

    expect(segment.intersectsPolygon(polygon)).toEqual([new Point(0, 0)]);
  });

  it("returns the expected intersection points for a linesegment which ends/starts in the polygon", function () {
    const segment = new LineSegment(new Point(-2, -2), new Point(2, 2));
    const polygon = Polygon.fromCoordinates([
      [
        [0, 0],
        [4, 0],
        [4, 4],
        [0, 4],
      ],
    ]);

    // FIXME: make intersectsPolygon return only unique intersection points
    expect(segment.intersectsPolygon(polygon)).toEqual([
      new Point(0, 0),
      new Point(0, 0),
    ]);
  });
});
