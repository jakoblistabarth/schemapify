import { v4 as uuid } from "uuid";
import config from "../../schematization.config.mjs";
import { crawlArray, getOccurrence } from "../utilities.mjs";

export const SIGNIFICANCE = {
  S: "significant",
  I: "insignificant",
  T: "treatedAsSignificant",
};

class Vertex {
  constructor(x, y) {
    this.uuid = uuid();
    this.x = x;
    this.y = y;
    this.edges = [];
    this.significance = null;
  }

  static getKey(x, y) {
    return `${x}/${y}`;
  }

  sortEdges(clockwise = true) {
    this.edges = this.edges.sort((a, b) => {
      if (clockwise) return b.getAngle() - a.getAngle();
      else return a.getAngle() - b.getAngle();
    });
    return this.edges;
  }

  getDistance(p) {
    const [x1, y1] = [this.x, this.y];
    const [x2, y2] = [p.x, p.y];

    const a = x1 - x2;
    const b = y1 - y2;

    return Math.sqrt(a * a + b * b);
  }

  removeIncidentEdge(edge) {
    const idx = this.edges.indexOf(edge);
    if (idx > -1) {
      this.edges.splice(idx, 1);
    }
    return this.edges;
  }

  allEdgesAligned(sectors = config.C.getSectors()) {
    return this.edges.every((edge) => edge.isAligned(sectors));
  }

  isSignificant(c = config.C) {
    // QUESTION: are vertices with only aligned edges never significant?
    // TODO: move to another class? to not mix dcel and schematization?

    // classify as insignificant if all edges are already aligned
    if (this.allEdgesAligned()) {
      return (this.significance = SIGNIFICANCE.I);
    }

    // classify as significant if one sector occurs multiple times
    const occupiedSectors = this.edges
      .map((edge) => edge.getAssociatedSector(c.getSectors()))
      .flat();

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

  assignAngles(c = config.C) {
    const edges = this.sortEdges(false);
    let anglesToAssign = [];
    const closestBounds = edges.map((edge) => {
      let direction;

      const [lower, upper] = edge.getAssociatedSector(c.getSectors())[0].getBounds();
      direction = edge.getAngle() - lower <= upper - edge.getAngle() ? lower : upper;
      direction = direction == Math.PI * 2 ? 0 : direction;

      return c.getAngles().indexOf(direction);
    });

    anglesToAssign = closestBounds;

    closestBounds.forEach((direction, idx) => {
      if (getOccurrence(anglesToAssign, direction) == 1) {
        anglesToAssign[idx] = direction;
        return;
      }

      const nextDirection = crawlArray(c.getAngles(), direction, +1);
      const prevDirection = crawlArray(c.getAngles(), direction, -1);
      if (getOccurrence(anglesToAssign, nextDirection) > 0) {
        anglesToAssign[idx] = prevDirection;
      } else {
        anglesToAssign[(idx + 1) % closestBounds.length] = nextDirection;
      }
    });

    edges.forEach((edge, idx) => (edge.assignedAngle = anglesToAssign[idx]));

    return this.edges;
  }
}

export default Vertex;
