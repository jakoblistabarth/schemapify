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

/**
 * Gets the angle of the HalfEdge's assigned direction.
 * @returns The angle in radians.
 */
export const getAssignedAngle = (
  assignedDirection: number,
  sectors: Sector[],
) => {
  return Math.PI * 2 * (assignedDirection / sectors.length);
};

/**
 * Determines whether the HalfEdge is aligned to one of the orientations of C.
 * @returns A boolean, indicating whether or not the {@link HalfEdge} is aligned.
 */
export const isAligned = (halfEdge: HalfEdge, sectors: Sector[]) => {
  return getAssociatedAngles(halfEdge, sectors).length === 1;
};

/**
 * Determines whether the HalfEdge's assigned Direction is adjacent to its associated sector.
 * @returns A boolean, indicating whether or not the {@link HalfEdge} is deviating.
 */
export const isDeviating = (
  halfEdge: HalfEdge,
  sectors: Sector[],
  assignedDirection: number,
) => {
  let assignedAngle = getAssignedAngle(assignedDirection, sectors);
  if (typeof assignedAngle !== "number") return false;
  if (isAligned(halfEdge, sectors)) {
    return (
      getAssociatedAngles(halfEdge, sectors)[0] !==
      getAssignedAngle(assignedDirection, sectors)
    );
  } else {
    const sector = getAssociatedSector(halfEdge, sectors)[0];
    //TODO: refactor find better solution for last sector (idx=0)
    if (sector.idx === sectors.length - 1 && assignedAngle === 0)
      assignedAngle = Math.PI * 2;
    return !sector.encloses(assignedAngle);
  }
};
