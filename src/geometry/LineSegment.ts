import Point from "./Point";
import Polygon from "./Polygon";
import Vector2D from "./Vector2D";
import { orient2d } from "robust-predicates";

/**
 * Class representing a 2-dimensional finite line.
 * It is defined by its endpoints.
 */
class LineSegment {
  endPoint1: Point;
  endPoint2: Point;

  constructor(endPoint1: Point, endPoint2: Point) {
    this.endPoint1 = endPoint1;
    this.endPoint2 = endPoint2;
  }

  get length() {
    return this.endPoint1.distanceToPoint(this.endPoint2);
  }

  /**
   * Determines whether or not the line segment intersects with another.
   * @credits Adapted from [codeproject.com](https://www.codeproject.com/tips/862988/find-the-intersection-point-of-two-line-segments)
   * @param lineSegment
   * @param considerCollinearOverlap. Whether to consider collinear overlaps as intersections. Defaults to `false`, meaning that collinear overlaps are not considered intersections.
   * @returns A {@link Point} representing the intersection point, if the line segments intersect, and `undefined` otherwise. If the line segments are collinear and `considerCollinearOverlap` is set to `true`, a `Point` with coordinates `(NaN, NaN)` is returned.
   */
  intersectsLineSegment(
    lineSegment: LineSegment,
    considerCollinearOverlap: boolean = false,
  ) {
    // Early exit for degenerate segments
    if (this.length === 0 || lineSegment.length === 0) return;

    const p1 = new Vector2D(this.endPoint1.x, this.endPoint1.y);
    const p2 = new Vector2D(this.endPoint2.x, this.endPoint2.y);
    const q1 = new Vector2D(lineSegment.endPoint1.x, lineSegment.endPoint1.y);
    const q2 = new Vector2D(lineSegment.endPoint2.x, lineSegment.endPoint2.y);

    const r = p2.minus(p1);
    const s = q2.minus(q1);
    const rxs = r.cross(s);
    const q1p1 = q1.minus(p1);
    const q1p1xr = q1p1.cross(r);

    // Use robust orientation tests for collinearity checks
    const p1_q1_q2_orient = orient2d(p1.dx, p1.dy, q1.dx, q1.dy, q2.dx, q2.dy);
    const q1_p1_p2_orient = orient2d(q1.dx, q1.dy, p1.dx, p1.dy, p2.dx, p2.dy);

    // If all four points form collinear relationships, check for overlap
    if (p1_q1_q2_orient === 0 && q1_p1_p2_orient === 0) {
      if (considerCollinearOverlap)
        if (
          (0 <= q1p1.dot(r) && q1p1.dot(r) <= r.dot(r)) ||
          (0 <= p1.minus(q1).dot(s) && p1.minus(q1).dot(s) <= s.dot(s))
        )
          return new Point(NaN, NaN);
      return;
    }

    // Parallel and non-intersecting case
    if (rxs === 0 && q1p1xr !== 0) return;

    const t = q1p1.cross(s) / rxs;
    const u = q1p1.cross(r) / rxs;

    // Check intersection with strict bounds
    if (rxs !== 0 && 0 <= t && t <= 1 && 0 <= u && u <= 1) {
      const intersectionV = p1.plus(r.times(t));
      return new Point(intersectionV.dx, intersectionV.dy);
    }
  }

  /**
   * Check whether it intersects with a given {@link Polygon}
   * TODO: Only considers exterior lineSegments of the polygon!
   * @param polygon The {@link Polygon} to check for intersections.
   * @returns An array of {@link Point}s where the line intersects the {@link Polygon}.
   */
  intersectsPolygon(polygon: Polygon) {
    const boundary = polygon.exteriorLineSegments;
    return boundary.reduce((acc: Point[], boundaryEdge) => {
      const intersection = this.intersectsLineSegment(boundaryEdge);
      if (intersection) acc.push(intersection);
      return acc;
    }, []);
  }
}

export default LineSegment;
