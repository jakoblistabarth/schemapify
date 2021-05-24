import { v4 as uuid } from "uuid";
import config from "../../schematization.config.mjs";

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

  sortEdges() {
    this.edges = this.edges.sort((a, b) => {
      return b.getAngle() - a.getAngle();
    });
  }

  getDistance(p) {
    const [x1, y1] = [this.x, this.y];
    const [x2, y2] = [p.x, p.y];

    const a = x1 - x2;
    const b = y1 - y2;

    const c = Math.sqrt(a * a + b * b);
    return c;
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

  isSignificant(sectors = config.C.getSectors()) {
    // QUESTION: are vertices with aligned edges always not signficant?
    // TODO: move to another class? to not mix dcel and schematization?

    // classify as not significant if all edges are already aligned
    if (this.allEdgesAligned()) {
      this.schematizationProperties.isSignificant = false;
      return false;
    }

    // classify as significant if one sector occurs multiple times
    const occupiedSectors = this.edges
      .map((edge) => edge.getSectorIndex(sectors))
      .flat()
      .sort();

    const uniqueSectors = Array.from(new Set(occupiedSectors));
    if (occupiedSectors.length !== uniqueSectors.length) {
      this.schematizationProperties.isSignificant = true;
      return true;
    }

    // classify as not significant if none of the sectors are neighbors
    const isSignificant = uniqueSectors.every((sector) => {
      const sectorIdx = sector;
      const nextSectorIdx = (sectorIdx + 1) % sectors.length;
      const prevSectorIdx = sectorIdx == 0 ? sectors.length - 1 : sectorIdx - 1;
      console.log(`
        examined sector: ${sectorIdx} => edges: ${this.getEdgesInSector(sectors[sectorIdx]).length} 
        edges in prev (${prevSectorIdx}): ${this.getEdgesInSector(sectors[prevSectorIdx]).length}
        edges in next prev(${nextSectorIdx}), ${
        this.getEdgesInSector(sectors[nextSectorIdx]).length
      }
      }
        `);
      if (
        this.getEdgesInSector(sectors[prevSectorIdx]).length > 0 ||
        this.getEdgesInSector(sectors[nextSectorIdx]).length > 0
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
}

export default Vertex;
