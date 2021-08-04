import Point from "./Point";
import HalfEdge from "../DCEL/HalfEdge";
import LineSegment from "./LineSegment";
import { crawlArray } from "../utilities";

class Line {
  points: Point[];
  area: number;

  constructor(points: Point[]) {
    this.points = points;
    this.area = this.getArea();
  }

  /**
   * Calculates the area of the irregular polyon defined by a set of points.
   * TODO: add credits!
   * @param points An array of Points, which has to be sorted (either clockwise or counter-clockwise).
   * @returns A number indicating the area of the polygon.
   */
  getArea(): number {
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

  getLineSegments(): LineSegment[] {
    return this.points.map((p, idx) => new LineSegment(p, crawlArray(this.points, idx, +1)));
  }

  getIntersections(edge: HalfEdge): Point[] | undefined {
    return this.getLineSegments().reduce((acc: Point[], boundaryEdge) => {
      const intersection = edge.toLineSegment()?.intersectsLineSegment(boundaryEdge);
      if (intersection) acc.push(intersection);
      return acc;
    }, []);
  }
}

export default Line;
