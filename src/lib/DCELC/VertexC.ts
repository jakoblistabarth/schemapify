import Vertex from "../DCEL/Vertex";
import DcelC from "./DcelC";
import HalfEdgeC from "./HalfEdgeC";

class VertexC extends Vertex {
  edges: HalfEdgeC[];
  significant: boolean;

  constructor(x: number, y: number, dcel: DcelC) {
    super(x, y, dcel);
    this.significant = undefined;
  }

  allEdgesAligned(): boolean {
    return this.edges.every((edge) => edge.isAligned());
  }

  isSignificant(): boolean {
    // QUESTION: are vertices with only aligned edges never significant?

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

export default VertexC;
