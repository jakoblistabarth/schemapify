import Vertex from "../Dcel/Vertex";
import Sector from "./Sector";

/**
 * Returns only incident HalfEdges which lie in the specified sector.
 * @param sector A sector, against which the {@link HalfEdge}s are checked.
 * @returns An array, containing all {@link HalfEdge}s lying in the sector.
 */
export const getEdgesInSector = (vertex: Vertex, sector: Sector) => {
  return vertex.edges.filter((edge) => {
    const angle = edge.getAngle();
    if (typeof angle === "number") return sector.encloses(angle);
  });
};
