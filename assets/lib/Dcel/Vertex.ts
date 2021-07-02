import { v4 as uuid } from "uuid";
import Sector from "../OrientationRestriction/Sector";
import Point from "../Geometry/Point";
import { crawlArray, getOccurrence } from "../utilities";
import Dcel from "./Dcel";
import HalfEdge from "./HalfEdge";

class Vertex extends Point {
  dcel: Dcel;
  uuid: string;
  edges: Array<HalfEdge>;
  significant: boolean;

  constructor(x: number, y: number, dcel: Dcel) {
    super(x, y);
    this.dcel = dcel;
    this.uuid = uuid();
    this.edges = [];
    this.significant = undefined;
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

  allEdgesAligned(): boolean {
    return this.edges.every((edge) => edge.isAligned());
  }

  isSignificant(): boolean {
    // QUESTION: are vertices with only aligned edges never significant?
    // TODO: move to another class? to not mix dcel and schematization?

    // classify as insignificant if all edges are already aligned
    if (this.allEdgesAligned()) {
      return (this.significant = false);
    }

    // classify as significant if one sector occurs multiple times
    const occupiedSectors = this.edges.map((edge) => edge.getAssociatedSector()).flat();

    const uniqueSectors = occupiedSectors.reduce((acc, sector) => {
      if (!acc.find((accSector) => accSector.idx == sector.idx)) acc.push(sector);
      return acc;
    }, []);

    if (occupiedSectors.length !== uniqueSectors.length) {
      return (this.significant = true);
    }

    // classify as significant if neighbor sectors are not empty
    const isSignificant = uniqueSectors.every((sector) => {
      const [prevSector, nextSector] = sector.getNeighbors();
      return (
        this.getEdgesInSector(prevSector).length > 0 || this.getEdgesInSector(nextSector).length > 0
      );
    });
    return (this.significant = isSignificant);
  }

  getEdgesInSector(sector: Sector): Array<HalfEdge> {
    return this.edges.filter((edge) => sector.encloses(edge.getAngle()));
  }

  assignDirections(): number[] {
    const edges = this.sortEdges(false);
    const sectors = this.dcel.config.c.getSectors();

    function getDeviation(edges: HalfEdge[], directions: number[]): number {
      return edges.reduce((deviation, edge, index) => {
        return deviation + edge.getDeviation(sectors[directions[index]]);
      }, 0);
    }

    const validDirections = this.dcel.config.c.getValidDirections(edges.length);

    let minmalDeviation = Infinity;
    let solution: number[] = [];

    validDirections.forEach((directions) => {
      for (let index = 0; index < directions.length; index++) {
        const deviation = getDeviation(edges, directions);

        if (deviation < minmalDeviation) {
          minmalDeviation = deviation;
          solution = [...directions];
        }
        directions.unshift(directions.pop());
      }
    });

    edges.forEach((edge, idx) => (edge.assignedDirection = solution[idx]));
    return solution;
  }
}

export default Vertex;
