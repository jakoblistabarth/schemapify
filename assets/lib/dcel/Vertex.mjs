import { v4 as uuid } from "uuid";
import Point from "../Point.mjs";
import { crawlArray, getOccurrence } from "../utilities.mjs";

export const SIGNIFICANCE = {
  S: "significant",
  I: "insignificant",
  T: "treatedAsSignificant",
};

class Vertex extends Point {
  constructor(x, y, dcel) {
    super(x, y);
    this.dcel = dcel;
    this.uuid = uuid();
    this.edges = [];
    this.significance = null;
  }

  static getKey(x, y) {
    return `${x}/${y}`;
  }

  distanceToVertex(p) {
    return this.distanceToPoint(p);
  }

  // adapted from https://github.com/scottglz/distance-to-line-segment/blob/master/index.js
  distanceToEdge(edge) {
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

  sortEdges(clockwise = true) {
    this.edges = this.edges.sort((a, b) => {
      if (clockwise) return b.getAngle() - a.getAngle();
      else return a.getAngle() - b.getAngle();
    });
    return this.edges;
  }

  removeIncidentEdge(edge) {
    const idx = this.edges.indexOf(edge);
    if (idx > -1) {
      this.edges.splice(idx, 1);
    }
    return this.edges;
  }

  allEdgesAligned() {
    return this.edges.every((edge) => edge.isAligned());
  }

  isSignificant() {
    // QUESTION: are vertices with only aligned edges never significant?
    // TODO: move to another class? to not mix dcel and schematization?

    // classify as insignificant if all edges are already aligned
    if (this.allEdgesAligned()) {
      return (this.significance = SIGNIFICANCE.I);
    }

    // classify as significant if one sector occurs multiple times
    const occupiedSectors = this.edges.map((edge) => edge.getAssociatedSector()).flat();

    const uniqueSectors = occupiedSectors.reduce((acc, sector) => {
      if (!acc.find((accSector) => accSector.idx == sector.idx)) acc.push(sector);
      return acc;
    }, []);

    if (occupiedSectors.length !== uniqueSectors.length) {
      return (this.significance = SIGNIFICANCE.S);
    }

    // classify as significant if neighbor sectors are not empty
    const isSignificant = uniqueSectors.every((sector) => {
      const [prevSector, nextSector] = sector.getNeighbors();
      return (
        this.getEdgesInSector(prevSector).length > 0 || this.getEdgesInSector(nextSector).length > 0
      );
    });
    return (this.significance = isSignificant ? SIGNIFICANCE.S : SIGNIFICANCE.I);
  }

  getEdgesInSector(sector) {
    return this.edges.filter((edge) => sector.encloses(edge.getAngle()));
  }

  assignAngles() {
    const edges = this.sortEdges(false);
    let anglesToAssign = [];
    const closestBounds = edges.map((edge) => {
      let direction;

      const [lower, upper] = edge.getAssociatedSector()[0].getBounds();
      direction = edge.getAngle() - lower <= upper - edge.getAngle() ? lower : upper;
      direction = direction == Math.PI * 2 ? 0 : direction;

      return this.dcel.config.C.getAngles().indexOf(direction);
    });

    anglesToAssign = closestBounds;

    closestBounds.forEach((direction, idx) => {
      if (getOccurrence(anglesToAssign, direction) == 1) {
        anglesToAssign[idx] = direction;
        return;
      }

      const nextDirection = crawlArray(this.dcel.config.C.getAngles(), direction, +1);
      const prevDirection = crawlArray(this.dcel.config.C.getAngles(), direction, -1);
      if (getOccurrence(anglesToAssign, nextDirection) > 0) {
        anglesToAssign[idx] = prevDirection;
      } else {
        anglesToAssign[(idx + 1) % closestBounds.length] = nextDirection;
      }
    });

    edges.forEach((edge, idx) => {
      if (!edge.assignAngle) edge.assignedAngle = anglesToAssign[idx];
    });

    return this.edges;
  }
}

export default Vertex;
