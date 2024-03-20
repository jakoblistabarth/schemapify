import Point from "./Point";
import HalfEdge from "../DCEL/HalfEdge";
import LineSegment from "./LineSegment";
import { crawlArray } from "../utilities";

/**
 * Class representing a 2-dimensional polygon.
 * It is defined by its control points.
 */
class Polygon {
  points: Point[];

  constructor(points: Point[]) {
    this.points = points;
  }

  /**
   * Calculates the area of the irregular polyon defined by a set of points.
   * TODO: add credits!
   * @param points An array of Points, which has to be sorted (either clockwise or counter-clockwise).
   * @returns A number indicating the area of the polygon.
   */
  get area(): number {
    let total = 0;

    for (let i = 0; i < this.points.length; i++) {
      const addX = this.points[i].x;
      const addY = this.points[i == this.points.length - 1 ? 0 : i + 1].y;
      const subX = this.points[i == this.points.length - 1 ? 0 : i + 1].x;
      const subY = this.points[i].y;

      total += addX * addY * 0.5;
      total -= subX * subY * 0.5;
    }

    return Math.abs(total);
  }

  get lineSegments(): LineSegment[] {
    return this.points.map(
      (p, idx) => new LineSegment(p, crawlArray(this.points, idx, +1)),
    );
  }

  getIntersections(edge: HalfEdge): Point[] | undefined {
    return this.lineSegments.reduce((acc: Point[], boundaryEdge) => {
      const intersection = edge
        .toLineSegment()
        ?.intersectsLineSegment(boundaryEdge);
      if (intersection && acc.every((point) => !point.equals(intersection)))
        acc.push(intersection);
      return acc;
    }, []);
  }
}

export default Polygon;
