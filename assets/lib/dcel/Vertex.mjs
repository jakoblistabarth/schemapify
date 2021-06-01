import { v4 as uuid } from "uuid";
import config from "../../schematization.config.mjs";
import { crawlArray } from "../dcel/Utilities.mjs";

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

    return Math.sqrt(a * a + b * b);
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
      .map((edge) => edge.getAssociatedSector())
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
    let edgeIdx = 0;
    let lastEdgeIdx = null;
    let directions = [];
    while (
      directions.length !== this.edges.length &&
      directions.length === Array.from(new Set(directions)).length
    ) {
      let direction;
      const edge = this.edges[edgeIdx];
      const currentSector = edge.getAssociatedSector(c.getSectors())[0];
      const [prevSector, nextSector] = currentSector.getNeighbors(c.getSectors());
      const edgesInCurrentSector = this.getEdgesInSector(currentSector);
      console.log("currentSector: ", currentSector);
      console.log("angle: ", edge.getAngle());
      if (edgesInCurrentSector.length === 4) {
        directions = [
          crawlArray(c.getAngles(), c.getAngles().indexOf(currentSector.lower), -1),
          c.getAngles().indexOf(currentSector.lower),
          c.getAngles().indexOf(currentSector.upper),
          crawlArray(c.getAngles(), c.getAngles().indexOf(currentSector.upper), +1),
        ];
        edgeIdx = 3;
      } else if (edgesInCurrentSector.length === 3) {
        directions = [
          c.getAngles().indexOf(currentSector.lower),
          c.getAngles().indexOf(currentSector.upper),
          crawlArray(c.getAngles(), c.getAngles().indexOf(currentSector.upper), +1),
        ];
        edgeIdx = (edgeIdx + edgesInCurrentSector.length) % this.edges.length;
      } else {
        console.log("edges in sector", edgesInCurrentSector.length);
        console.log("edges in prev", this.getEdgesInSector(prevSector).length);
        console.log("edges in next", this.getEdgesInSector(nextSector).length);
        if (this.getEdgesInSector(nextSector).length > 1) {
          if (edgesInCurrentSector.length === 2) {
            if (edgeIdx % 2 == 0) {
              direction =
                c.getAngles()[
                  crawlArray(c.getAngles(), c.getAngles().indexOf(currentSector.lower), -1)
                ];
            } else direction = edge.getAssociatedSector(c.getSectors())[0].lower;
          } else direction = edge.getAssociatedSector(c.getSectors())[0].lower;
        } else if (edge.isAligned(c.getSectors())) {
          direction = edge.getAssociatedDirections(c.getSectors())[0];
        } else {
          console.log("here =======> " + edgeIdx);
          const angle = edge.getAngle();
          const [lower, upper] = edge.getAssociatedDirections(c.getSectors());
          direction = angle - lower <= upper - angle ? lower : upper;
        }
        console.log("dir", direction);
        direction = direction == Math.PI * 2 ? 0 : direction;
        let directionIdx = c.getAngles().indexOf(direction);
        console.log(
          directions,
          directionIdx,
          "<>",
          directions[crawlArray(directions, edgeIdx, -1)]
        );
        if (directionIdx === directions[lastEdgeIdx])
          directionIdx = (directionIdx + 1) % c.getSectors().length;
        directions[edgeIdx] = directionIdx;
      }
      console.log(edgeIdx, directions);
      lastEdgeIdx = edgeIdx;
      edgeIdx = (edgeIdx + 1) % this.edges.length;
    }
    this.edges.forEach((edge, idx) => (edge.schematizationProperties.direction = directions[idx]));
    return this.edges;
  }
}

export default Vertex;
