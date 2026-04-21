import Vertex from "../Dcel/Vertex";
import LineSegment from "../geometry/LineSegment";
import Sector from "./Sector";

/**
 * Returns only incident HalfEdges which lie in the specified sector.
 * @param vertex A Vertex, which is the origin for the {@link Sector}s.
 * @param sector A sector, against which the {@link HalfEdge}s are checked.
 * @returns An array, containing all {@link HalfEdge}s lying in the sector.
 */
export const getEdgesInSector = (vertex: Vertex, sector: Sector) => {
  return vertex.edges.filter((edge) => {
    const angle = edge.getAngle();
    if (typeof angle === "number") return sector.encloses(angle);
  });
};

export const isCollinearVertex = (vertex: Vertex) => {
  if (vertex.degree !== 2) return false;
  const [p, q] = vertex.edges.map((e) => e.head);
  if (!p || !q) return undefined;
  const line = new LineSegment(p, q);
  return vertex.isOnLineSegment(line);
};
