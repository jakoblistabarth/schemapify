import HalfEdge from "../Dcel/HalfEdge";
import Sector from "./Sector";

/**
 * Gets the significant Vertex of the HalfEdge.
 * A Vertex is significant if its incident Edges reside in the same sector or adjacent sectors.
 * @param halfEdge The HalfEdge to get the significant Vertex from.
 * @returns The significant {@link Vertex} of the {@link HalfEdge}, if it exists.
 */
export const getSignificantVertex = (
  halfEdge: HalfEdge,
  significantVertices: string[],
) => {
  const endPoints = halfEdge.endpoints;
  if (endPoints)
    return endPoints.find((v) => significantVertices.includes(v.uuid));
};

/**
 * Gets the associated angle of the HalfEdge, which are the defined as the
 * sector bounds of the sector enclosing the HalfEdge.
 * @param halfEdge The HalfEdge to get the associated angles from.
 * @param sectors The sectors to get the angles from.
 * @returns An Array of angles in radians. It has length one if the {@link HalfEdge} is aligned.
 */
export const getAssociatedAngles = (halfEdge: HalfEdge, sectors: Sector[]) => {
  const angle = halfEdge.getAngle();
  if (typeof angle !== "number") return [];
  const directions: number[] = [];
  sectors.some(function (sector) {
    if (angle === sector.lower) {
      return directions.push(sector.lower);
    } else if (angle === sector.upper) {
      return directions.push(sector.upper);
    } else if (angle > sector.lower && angle < sector.upper) {
      return directions.push(sector.lower, sector.upper);
    }
  });

  return directions;
};

/**
 * Gets the sector(s) the HalfEdge is enclosed by.
 * @param halfEdge The HalfEdge to get the associated sector from.
 * @param sectors The sectors to get the sector from.
 * @returns An array of Sectors. It has length 2 if the {@link HalfEdge} is aligned.
 */
export const getAssociatedSector = (halfEdge: HalfEdge, sectors: Sector[]) => {
  const associatedAngles = getAssociatedAngles(halfEdge, sectors);
  const direction = associatedAngles;

  return sectors.reduce((acc: Sector[], sector) => {
    if (
      (direction[0] === sector.lower && direction[1] === sector.upper) ||
      +direction === sector.lower ||
      +direction === sector.upper ||
      +direction === sector.upper - Math.PI * 2
    ) {
      acc.push(sector);
    }
    return acc;
  }, []);
};
