import Configuration, { OuterEdge } from "../c-oriented-schematization/Configuration";
import Dcel from "../DCEL/Dcel";
import Vertex from "../DCEL/Vertex";
import LineSegment from "./LineSegment";

class Point {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  xy() {
    return [this.x, this.y];
  }

  distanceToPoint(p: Point) {
    const [x1, y1] = this.xy();
    const [x2, y2] = p.xy();

    const a = x1 - x2;
    const b = y1 - y2;

    return Math.sqrt(a * a + b * b);
  }

  getNewPoint(distance: number, angle: number): Point {
    // QUESTION: do i really need this conditions for dx, and dy because js' sin/cos implementation is inaccurate??
    const dx = angle === Math.PI * 0.5 || angle === Math.PI * 1.5 ? 0 : Math.cos(angle);
    const dy = angle === Math.PI * 1 || angle === Math.PI * 2 ? 0 : Math.sin(angle);
    return new Point(this.x + distance * dx, this.y + distance * dy);
  }

  isOnLineSegment(lineSegment: LineSegment) {
    const PA = this.distanceToPoint(lineSegment.endPoint1);
    const PB = this.distanceToPoint(lineSegment.endPoint2);
    return parseFloat((PA + PB).toFixed(10)) === parseFloat(lineSegment.getLength().toFixed(10));
  }

  /**
   * Checks whether the {@link Point} lies within the specified polygon.
   * This algorithm works only on convex polygons.
   * This poses no problem as all {@link staircase} regions are by definition convex polygons.
   * as seen @ [algorithmtutor.com](https://algorithmtutor.com/Computational-Geometry/Check-if-a-point-is-inside-a-polygon/)
   * @param polygon An array of Points.
   * @returns A boolean indicating, whether the Point is within the specified polygon.
   */
  isInPolygon(polygon: Point[]) {
    const A: number[] = [];
    const B: number[] = [];
    const C: number[] = [];

    polygon.forEach((p, idx) => {
      const p1 = p;
      const p2 = polygon[(idx + 1) % polygon.length];

      // calculate A, B and C
      const a = -(p2.y - p1.y);
      const b = p2.x - p1.x;
      const c = -(a * p1.x + b * p1.y);

      A.push(a);
      B.push(b);
      C.push(c);
    });

    const D = A.map((elem, idx) => elem * this.x + B[idx] * this.y + C[idx]);

    const t1 = D.every((d) => d >= 0);
    const t2 = D.every((d) => d <= 0);
    return t1 || t2;
  }

  /**
   * Determines whether or not the Point is a valid intersection Point.
   * @param configuration A {@link Configuration} for which the validity of the {@link Point} is determined.
   * @returns A Boolean indicating whether or not the {@link Point} is a valid.
   */
  isValidIntersectionPoint(configuration: Configuration): boolean {
    // check whether or not the point is equivalent to the configuration's first and last vertex
    const startPoint = configuration.getOuterEdge(OuterEdge.PREV).getTail();
    const endPoint = configuration.getOuterEdge(OuterEdge.NEXT).getHead();
    if (
      this.xy().every((pos) => startPoint.xy().includes(pos)) ||
      this.xy().every((pos) => endPoint.xy().includes(pos))
    )
      return true;

    // check whether or not the point is on any edge of the face's boundary which is not part of X
    return configuration.innerEdge
      .getCycle()
      .filter((edge) => !configuration.getX().includes(edge))
      .every((edge) => !this.isOnLineSegment(new LineSegment(edge.getTail(), edge.getHead())));
  }
}

export default Point;
