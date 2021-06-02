import { v4 as uuid } from "uuid";
import config from "../../schematization.config.mjs";
import { crawlArray, getOccurrence } from "../dcel/Utilities.mjs";

class Vertex {
  constructor(x, y) {
    this.uuid = uuid();
    this.x = x;
    this.y = y;
    this.edges = [];
    this.schematizationProperties = {};
  }

  static getKey(x, y) {
    return `${x}/${y}`; // TODO: is there a better way to ensure that a coordinate pair vertex is added only once to the vertex list?
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

    // classify as not significant if all edges are already aligned
    if (this.allEdgesAligned()) {
      this.schematizationProperties.isSignificant = false;
      return false;
    }

    // classify as significant if one sector occurs multiple times
    const occupiedSectors = this.edges
      .map((edge) => edge.getAssociatedSector(c.getSectors()))
      .flat()
      .sort();

    const uniqueSectors = occupiedSectors.reduce((acc, sector) => {
      if (!acc.find((accSector) => accSector.idx == sector.idx)) acc.push(sector);
      return acc;
    }, []);

    if (occupiedSectors.length !== uniqueSectors.length) {
      this.schematizationProperties.isSignificant = true;
      return true;
    }

    // classify as not significant if none of the sectors are neighbors
    const isSignificant = uniqueSectors.every((sector) => {
      const [prevSector, nextSector] = sector.getNeighbors();
      if (
        this.getEdgesInSector(prevSector).length > 0 ||
        this.getEdgesInSector(nextSector).length > 0
      )
        return true;
    });
    this.schematizationProperties.isSignificant = isSignificant;
    return isSignificant;
  }

  getEdgesInSector(sector) {
    return this.edges.filter((edge) => {
      return edge.isInSector(sector);
    });
  }

  assignDirections(c = config.C) {
    const edges = this.sortEdges(false);
    let assignedDirections = [];
    const closestBounds = edges.map((edge) => {
      let direction;

      const [lower, upper] = edge.getAssociatedSector(c.getSectors())[0].getBounds();
      direction = edge.getAngle() - lower <= upper - edge.getAngle() ? lower : upper;
      direction = direction == Math.PI * 2 ? 0 : direction;

      return c.getAngles().indexOf(direction);
    });

    assignedDirections = closestBounds;

    closestBounds.forEach((direction, idx) => {
      if (getOccurrence(assignedDirections, direction) == 1) {
        assignedDirections[idx] = direction;
        return;
      }

      const nextDirection = crawlArray(c.getAngles(), direction, +1);
      const prevDirection = crawlArray(c.getAngles(), direction, -1);
      if (getOccurrence(assignedDirections, nextDirection) > 0) {
        assignedDirections[idx] = prevDirection;
      } else {
        assignedDirections[(idx + 1) % closestBounds.length] = nextDirection
      };
    });

    edges.forEach(
      (edge, idx) => (edge.schematizationProperties.direction = assignedDirections[idx])
    );

    return this.edges;
  }
}

export default Vertex;
