import Dcel from "../Dcel/Dcel";
import HalfEdge from "../Dcel/HalfEdge";
import Vertex from "../Dcel/Vertex";
import Generator from "../Schematization/Generator";
import C from "./C";
import {
  getAssociatedAngles,
  getAssociatedSector,
  getSignificantVertex,
} from "./HalfEdgeUtils";
import Sector from "./Sector";
import { getEdgesInSector } from "./VertexUtils";

export enum Orientation {
  AB = "alignedBasic",
  UB = "unalignedBasic",
  E = "evading",
  AD = "alignedDeviating",
  UD = "unalignedDeviating",
}

class HalfEdgeClassGenerator implements Generator {
  c: C;
  significantVertices: string[];
  halfEdgeClasses: Map<string, Orientation>;
  assignedDirections: Map<string, number>;

  constructor(c: C, significantVertices: string[]) {
    this.c = c;
    this.significantVertices = significantVertices;
    this.halfEdgeClasses = new Map();
    this.assignedDirections = new Map();
  }

  /**
   * Classifies all Halfedges in the DCEL.
   * @param input The DCEL to classify.
   */
  public run(input: Dcel) {
    return input
      .getHalfEdges()
      .reduce<
        Map<string, { orientation: Orientation; assignedDirection: number }>
      >((acc, edge) => {
        const orientation = this.classify(
          edge,
          this.c,
          this.significantVertices,
        );
        const assignedDirection = this.assignedDirections.get(edge.uuid);
        if (orientation && (assignedDirection || assignedDirection === 0)) {
          acc.set(edge.uuid, { orientation, assignedDirection });
          edge.twin &&
            acc.set(edge.twin.uuid, { orientation, assignedDirection });
        }
        return acc;
      }, new Map());
  }

  /**
   * Classifies a Halfedge and its twin, based on its orientation.
   * The classes depend on the defined set of orientations, the setup of {@link C}.
   * @param halfEdge The HalfEdge to classify.
   * @param c The set of orientations to classify the HalfEdge with.
   * @param significantVertices The significant Vertices of the DCEL.
   * @returns The classification of the HalfEdge.
   */
  private classify(halfEdge: HalfEdge, c: C, significantVertices: string[]) {
    this.assignDirections(halfEdge.tail, c);

    // do not overwrite classification
    if (this.getClass(halfEdge)) return;

    // do not classify a HalfEdge which has a significant head
    const head = halfEdge.head;
    if (head && significantVertices.includes(head.uuid)) return;
    const assignedDirection = this.assignedDirections.get(halfEdge.uuid);
    if (!assignedDirection && assignedDirection !== 0) return;
    const associatedSector = getAssociatedSector(halfEdge, c.sectors);
    const sector = associatedSector[0];
    const significantVertex =
      getSignificantVertex(halfEdge, this.significantVertices) || halfEdge.tail;
    const edges = getEdgesInSector(significantVertex, sector).filter(
      (edge) =>
        !isAligned(edge, c.sectors) &&
        !this.isDeviating(edge, c.sectors, assignedDirection),
    );

    let classification: Orientation;
    if (isAligned(halfEdge, c.sectors)) {
      classification = this.isDeviating(halfEdge, c.sectors, assignedDirection)
        ? Orientation.AD
        : Orientation.AB;
    } else if (this.isDeviating(halfEdge, c.sectors, assignedDirection)) {
      classification = Orientation.UD;
    } else if (edges.length == 2) {
      classification = Orientation.E;
    } else {
      classification = Orientation.UB;
    }

    return classification;
  }

  /**
   * Determines whether the HalfEdge's assigned Direction is adjacent to its associated sector.
   * @returns A boolean, indicating whether or not the {@link HalfEdge} is deviating.
   */
  private isDeviating(
    halfEdge: HalfEdge,
    sectors: Sector[],
    assignedDirection: number,
  ) {
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
  }

  /**
   * Gets the assigned angle of the HalfEdge.
   * @param halfEdge The HalfEdge to get the class from.
   * @returns The assigned angle of the {@link HalfEdge}, if it exists.
   * */
  private getClass(halfEdge: HalfEdge) {
    return this.halfEdgeClasses.get(halfEdge.uuid);
  }

  /**
   * Assigns directions to all incident HalfEdges of the Vertex.
   * @returns An Array, holding the assigned directions starting
   * with the direction of the {@link HalfEge} with the smallest angle on the unit circle.
   * Direction indices are based on the sectors of C.
   * For e.g., for C2, the directions are [0, 1, 2, 3], where 0 is 0 degree on the unit circle.
   */
  assignDirections(vertex: Vertex, c: C) {
    const edges = vertex.sortEdges(false);
    const sectors = c.sectors;

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

    edges.forEach((edge, idx) =>
      this.assignedDirections.set(edge.uuid, solution[idx]),
    );
    return solution;
  }
}

export default HalfEdgeClassGenerator;

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
