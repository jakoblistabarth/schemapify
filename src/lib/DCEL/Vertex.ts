import { v4 as uuid } from "uuid";
import Point from "../geometry/Point";
import Dcel from "./Dcel";
import HalfEdge from "./HalfEdge";

class Vertex extends Point {
  dcel: Dcel;
  uuid: string;
  edges: Array<HalfEdge>;

  constructor(x: number, y: number, dcel: Dcel) {
    super(x, y);
    this.dcel = dcel;
    this.uuid = uuid();
    this.edges = [];
  }

  static getKey(x: number, y: number): string {
    return `${x}/${y}`;
  }

  /**
   *
   * @param stop defines how many strings of the uuid are returned
   * @returns the edge's uuid
   */
  getUuid(length?: number) {
    // QUESTION: extending classes instead of declaring this method separately for all 3 dcel entities?
    return this.uuid.substring(0, length);
  }

  distanceToVertex(p: Point): number {
    return this.distanceToPoint(p);
  }

  // adapted from https://github.com/scottglz/distance-to-line-segment/blob/master/index.js
  distanceToEdge(edge: HalfEdge): number {
    const [vx, vy] = this.xy();
    const [e1x, e1y] = edge.getTail().xy();
    const [e2x, e2y] = edge.getHead().xy();
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

  sortEdges(clockwise: boolean = true): Array<HalfEdge> {
    this.edges = this.edges.sort((a, b) => {
      if (clockwise) return b.getAngle() - a.getAngle();
      else return a.getAngle() - b.getAngle();
    });
    return this.edges;
  }

  removeIncidentEdge(edge: HalfEdge): Array<HalfEdge> {
    const idx = this.edges.indexOf(edge);
    if (idx > -1) {
      this.edges.splice(idx, 1);
    }
    return this.edges;
  }
}

export default Vertex;
