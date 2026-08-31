import { EPSILON, TWO_PI } from "./constants";
import Line from "./Line";
import LineSegment from "./LineSegment";
import Polygon from "./Polygon";
import Vector2D from "./Vector2D";

/** Class representing a 2-dimensional point. */
class Point {
  x: number;
  y: number;

  /**
   * Create a point.
   * @param {number} x - The x value.
   * @param {number} y - The y value.
   */
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  /**
   * Gets the x and y coordinates of the point as tuple.
   * @returns A tuple.
   */
  get xy() {
    return [this.x, this.y] as [number, number];
  }

  /**
   * Converts the Point to a {@link Vector2D}.
   * @returns The Point as a {@link Vector2D}.
   */
  get vector() {
    return new Vector2D(this.x, this.y);
  }

  /**
   * Determines the distance between two Points.
   * @param p A {@link Point} to calculate the distance to.
   * @returns The distance between the two Points.
   */
  distanceToPoint(p: Point) {
    const [x1, y1] = this.xy;
    const [x2, y2] = p.xy;

    const a = x1 - x2;
    const b = y1 - y2;

    return Math.sqrt(a * a + b * b);
  }

  /**
   * Determines the distance between the point and a line segment.
   * @param l A {@link LineSegment} to calculate the distance to.
   * @returns The distance between the point and the line segment.
   */
  distanceToLineSegment(l: LineSegment) {
    const [vx, vy] = this.xy;
    const [e1x, e1y] = l.endPoint1.xy;
    const [e2x, e2y] = l.endPoint2.xy;
    const edx = e2x - e1x;
    const edy = e2y - e1y;
    const lineLengthSquared = edx ** 2 + edy ** 2;

    let t = ((vx - e1x) * edx + (vy - e1y) * edy) / lineLengthSquared;
    if (t < 0) t = 0;
    else if (t > 1) t = 1;

    const ex = e1x + t * edx,
      ey = e1y + t * edy,
      dx = vx - ex,
      dy = vy - ey;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Gets a new Point at a specified distance and angle from the Point.
   * @param distance The distance from the Point.
   * @param angle The angle in radians.
   * @returns A new Point at the specified distance and angle from the Point.
   */
  getNewPoint(distance: number, angle: number) {
    // QUESTION: do i really need this conditions for dx, and dy because js' sin/cos implementation is inaccurate??
    const dx =
      angle === Math.PI * 0.5 || angle === Math.PI * 1.5 ? 0 : Math.cos(angle);
    const dy = angle === Math.PI * 1 || angle === TWO_PI ? 0 : Math.sin(angle);
    return new Point(this.x + distance * dx, this.y + distance * dy);
  }

  /**
   * Determines whether or not the Point lies on a specified LineSegment.
   * More specifically, it checks if the sum of distances from the Point to both endpoints is equal to the line segment's length.
   * @param lineSegment A {@link LineSegment} to be checked.
   * @returns A boolean, indicating whether or not the Point lies on the LineSegment.
   */
  isOnLineSegment(lineSegment: LineSegment) {
    const PA = this.distanceToPoint(lineSegment.endPoint1);
    const PB = this.distanceToPoint(lineSegment.endPoint2);
    return Math.abs(PA + PB - lineSegment.length) < EPSILON;
  }

  /**
   * Determines whether or not the Point lies on the specified LineSegments.
   * @param lineSegment An array of {@link LineSegment}s to be checked.
   * @returns A boolean, indicating whether or not the Point lies on the LineSegments.
   */
  isOnLineSegments(lineSegments: LineSegment[]) {
    return lineSegments.some((lineSegment) =>
      this.isOnLineSegment(lineSegment),
    );
  }

  /**
   * Determines whether the {@link Point} lies within the boundary of the specified polygon.
   * This algorithm works only(!) on convex polygons.
   * This poses no problem as all {@link staircase} regions are by definition convex polygons.
   * as seen @ [algorithmtutor.com](https://algorithmtutor.com/Computational-Geometry/Check-if-a-point-is-inside-a-polygon/)
   * @param polygon An array of Points.
   * @returns A boolean indicating, whether the Point is within the specified polygon.
   */
  isInPolygon(polygon: Polygon) {
    const A: number[] = [];
    const B: number[] = [];
    const C: number[] = [];

    // Read once: the getter re-derives the ring's winding on every access.
    const points = polygon.exteriorRing.points;

    points.forEach((p, idx) => {
      const p1 = p;
      const p2 = points[(idx + 1) % points.length];

      // calculate A, B and C
      const a = -(p2.y - p1.y);
      const b = p2.x - p1.x;
      const c = -(a * p1.x + b * p1.y);

      A.push(a);
      B.push(b);
      C.push(c);
    });

    const D = A.map((elem, idx) => elem * this.x + B[idx] * this.y + C[idx]);

    const t1 = D.every((d) => d >= -EPSILON);
    const t2 = D.every((d) => d <= EPSILON);

    return t1 || t2;
  }

  /**
   * Determines whether two Points' positions are equal.
   * @param point A {@link Point} the Point is compared to.
   * @returns A boolean, indicating whether or not the {@link Point}'s position equals the specified {@link Point}'s position.
   */
  equals(point: Point) {
    return (
      Math.abs(this.x - point.x) < EPSILON &&
      Math.abs(this.y - point.y) < EPSILON
    );
  }

  /**
   * Tests whether the point lies on a given (infinite) line.
   * Measured as the distance to the line rather than as the line equation's residual:
   * the equation adds two terms as large as the coordinates themselves before they
   * cancel, which for coordinates in the millions leaves a residual well past
   * EPSILON for a point which lies on the line to within a fraction of a micron.
   * @param line The {@link Line} to check for collinearity with the point.
   * @returns A boolean, indicating whether or not the point lies on the line.
   */
  isOnLine(line: Line) {
    return line.perpendicularDistanceToPoint(this) < EPSILON;
  }
}

export default Point;
