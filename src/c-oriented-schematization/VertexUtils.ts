import Vertex from "../Dcel/Vertex";
import Sector from "./Sector";
import { orient2d } from "robust-predicates";

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
  if (vertex.edges.length !== 2) return false;
  const [e1, e2] = vertex.edges;
  const h1 = e1.head;
  const h2 = e2.head;
  if (!h1 || !h2) return false;
  const o = orient2d(h1.x, h1.y, vertex.x, vertex.y, h2.x, h2.y);
  const isCollinear = o === 0;
  if (!isCollinear) return false;
  // Ensure the two incident edges point in opposite directions (straight line)
  const v1x = h1.x - vertex.x;
  const v1y = h1.y - vertex.y;
  const v2x = h2.x - vertex.x;
  const v2y = h2.y - vertex.y;
  return v1x * v2x + v1y * v2y < 0;
};
