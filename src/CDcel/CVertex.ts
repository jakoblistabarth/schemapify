import Vertex from "@/src/Dcel/Vertex";
import Dcel from "@/src/Dcel/Dcel";
import Sector from "@/src/c-oriented-schematization/Sector";
import HalfEdge from "@/src/Dcel/HalfEdge";
import C from "@/src/c-oriented-schematization/C";
import CHalfEdge from "./CHalfEdge";

class CVertex extends Vertex {
  significant?: boolean;
  edges: CHalfEdge[];

  constructor(x: number, y: number, dcel: Dcel) {
    super(x, y, dcel);
    this.edges = [];
  }

  /**
   * Determines whether all incident Edges to the Vertex are aligned (to C).
   * @returns A Boolean indicating whether or not all {@link HalfEdge}s are aligned.
   */
  allEdgesAligned(sectors: Sector[]): boolean {
    return this.edges.every((edge) => edge.isAligned(sectors));
  }

  /**
   * Determines the significance of the Vertex..
   * @returns A Boolean indicating whether or not the {@link Vertex} is significant.
   */
  isSignificant(sectors: Sector[]): boolean {
    // TODO: move to another class? to not mix dcel and schematization?

    // classify as insignificant if all edges are already aligned
    if (this.allEdgesAligned(sectors)) {
      return (this.significant = false);
    }

    // classify as significant if one sector occurs multiple times
    const occupiedSectors = this.edges
      .map((edge) => edge.getAssociatedSector(sectors))
      .flat();

    const uniqueSectors: Sector[] = occupiedSectors.reduce(
      (acc: Sector[], sector: Sector) => {
        if (!acc.find((accSector) => accSector.idx == sector.idx))
          acc.push(sector);
        return acc;
      },
      [],
    );

    if (occupiedSectors.length !== uniqueSectors.length) {
      return (this.significant = true);
    }

    // classify as significant if neighbor sectors are not empty
    const isSignificant = uniqueSectors.every((sector: Sector) => {
      const [prevSector, nextSector] = sector.getNeighbors();
      return (
        this.getEdgesInSector(prevSector).length > 0 ||
        this.getEdgesInSector(nextSector).length > 0
      );
    });
    return (this.significant = isSignificant);
  }

  /**
   * Returns only incident HalfEdges which lie in the specified sector.
   * @param sector A sector, against which the {@link HalfEdge}s are checked.
   * @returns An array, containing all {@link HalfEdge}s lying in the sector.
   */
  getEdgesInSector(sector: Sector): HalfEdge[] {
    return this.edges.filter((edge) => {
      const angle = edge.getAngle();
      if (typeof angle === "number") return sector.encloses(angle);
    });
  }

  /**
   * Assigns directions to all incident HalfEdges of the Vertex.
   * @returns An Array, holding the assigned directions starting with the direction of the {@link HalfEge} with the smallest angle on the unit circle.
   */
  assignDirections(c: C): number[] | undefined {
    const edges = this.sortEdges(false);
    const sectors = c.getSectors();

    function getDeviation(edges: HalfEdge[], directions: number[]): number {
      return edges.reduce((deviation, edge, index) => {
        const newDeviation = edge.getDeviation(sectors[directions[index]]);
        return typeof newDeviation === "number"
          ? deviation + newDeviation
          : Infinity;
      }, 0);
    }

    const validDirections = c.getValidDirections(edges.length);

    let minmalDeviation = Infinity;
    let solution: number[] = [];

    validDirections.forEach((directions) => {
      for (let index = 0; index < directions.length; index++) {
        const deviation = getDeviation(edges, directions);

        if (deviation < minmalDeviation) {
          minmalDeviation = deviation;
          solution = [...directions];
        }
        const lastElement = directions.pop();
        if (lastElement) directions.unshift(lastElement);
      }
    });

    edges.forEach((edge, idx) => (edge.assignedDirection = solution[idx]));
    return solution;
  }
}

export default CVertex;
