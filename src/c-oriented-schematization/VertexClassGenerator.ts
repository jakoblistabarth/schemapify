import Dcel from "../Dcel/Dcel";
import Vertex from "../Dcel/Vertex";
import Generator from "../Schematization/Generator";
import { getAssociatedSector, isAligned } from "./HalfEdgeUtils";
import Sector from "./Sector";
import { getEdgesInSector } from "./VertexUtils";

class VertexClassGenerator implements Generator {
  sectors: Sector[];

  constructor(sectors: Sector[]) {
    this.sectors = sectors;
  }

  /**
   * Classifies all Vertices in the DCEL.
   * This also adds new Vertices on every HalfEdge which has two significant Vertices.
   * By doing so it is guaranteed that every HalfEdge has at most one significant Vertex.
   */
  public run(input: Dcel) {
    return input.getVertices().reduce<Array<string>>((acc, v) => {
      return this.isSignificant(v, this.sectors) ? [...acc, v.uuid] : acc;
    }, []);
  }

  /**
   * Determines the significance of the Vertex..
   * @returns A Boolean indicating whether or not the {@link Vertex} is significant.
   */
  private isSignificant(vertex: Vertex, sectors: Sector[]) {
    // classify as insignificant if all edges are already aligned
    if (this.hasOnlyAlignedEdges(vertex, sectors)) return false;

    // classify as significant if one sector occurs multiple times
    const occupiedSectors = vertex.edges
      .map((edge) => getAssociatedSector(edge, sectors))
      .flat();
    const uniqueSectors: Sector[] = occupiedSectors.reduce(
      (acc: Sector[], sector: Sector) => {
        if (!acc.find((accSector) => accSector.idx == sector.idx))
          acc.push(sector);
        return acc;
      },
      [],
    );
    if (occupiedSectors.length !== uniqueSectors.length) return true;

    // classify as significant if neighbor sectors are not empty
    return uniqueSectors.every((sector: Sector) => {
      const [prevSector, nextSector] = sector.getNeighbors();
      return (
        getEdgesInSector(vertex, prevSector).length > 0 ||
        getEdgesInSector(vertex, nextSector).length > 0
      );
    });
  }

  /**
   * Determines whether all incident Edges to the Vertex are aligned (to C).
   * @returns A Boolean indicating whether or not all {@link HalfEdge}s are aligned.
   */
  private hasOnlyAlignedEdges(vertex: Vertex, sectors: Sector[]) {
    return vertex.edges.every((edge) => isAligned(edge, sectors));
  }
}

export default VertexClassGenerator;
