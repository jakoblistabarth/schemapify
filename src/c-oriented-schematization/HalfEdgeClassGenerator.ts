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

export enum OrientationClasses {
  AB = "alignedBasic",
  UB = "unalignedBasic",
  E = "evading",
  AD = "alignedDeviating",
  UD = "unalignedDeviating",
}

class HalfEdgeClassGenerator implements Generator {
  c: C;
  significantVertices: string[];
  halfEdgeClasses: Map<string, OrientationClasses>;
  assignedDirections: Map<string, number>;

  constructor(c: C, significantVertices: string[]) {
    this.c = c;
    this.significantVertices = significantVertices;
    this.halfEdgeClasses = new Map();
    this.assignedDirections = new Map();
  }

  /**
   * Classifies all Vertices in the DCEL.
   * @param input The DCEL to classify.
   */
  public run(input: Dcel) {
    return input
      .getHalfEdges()
      .reduce<Map<string, OrientationClasses>>((acc, e) => {
        const classification = this.classify(
          e,
          this.c,
          this.significantVertices,
        );
        if (classification) {
          acc.set(e.uuid, classification);
          e.twin && acc.set(e.twin.uuid, classification);
        }
        return acc;
      }, new Map());
  }

  /**
   * Classifies a HalfEdge and its twin, based on its orientation.
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

    const sectors = c.sectors;
    const associatedSector = getAssociatedSector(halfEdge, sectors);
    const sector = associatedSector[0];
    const significantVertex =
      getSignificantVertex(halfEdge, this.significantVertices) || halfEdge.tail;
    const edges = getEdgesInSector(significantVertex, sector).filter(
      (edge) =>
        !this.isAligned(edge, sectors) && !this.isDeviating(edge, sectors),
    );

    let classification: OrientationClasses;
    if (this.isAligned(halfEdge, sectors)) {
      classification = this.isDeviating(halfEdge, sectors)
        ? OrientationClasses.AD
        : OrientationClasses.AB;
    } else if (this.isDeviating(halfEdge, sectors)) {
      classification = OrientationClasses.UD;
    } else if (edges.length == 2) {
      classification = OrientationClasses.E;
    } else {
      classification = OrientationClasses.UB;
    }

    return classification;
  }

  /**
   * Determines whether the HalfEdge is aligned to one of the orientations of C.
   * @returns A boolean, indicating whether or not the {@link HalfEdge} is aligned.
   */
  private isAligned(halfEdge: HalfEdge, sectors: Sector[]) {
    return getAssociatedAngles(halfEdge, sectors).length === 1;
  }

  /**
   * Determines whether the HalfEdge's assigned Direction is adjacent to its associated sector.
   * @returns A boolean, indicating whether or not the {@link HalfEdge} is deviating.
   */
  private isDeviating(halfEdge: HalfEdge, sectors: Sector[]) {
    let assignedAngle = this.getAssignedAngle(halfEdge, sectors);
    if (typeof assignedAngle !== "number") return false;
    if (this.isAligned(halfEdge, sectors)) {
      return (
        getAssociatedAngles(halfEdge, sectors)[0] !==
        this.getAssignedAngle(halfEdge, sectors)
      );
    } else {
      const sector = getAssociatedSector(halfEdge, sectors)[0];
      //TODO: refactor find better solution for last sector (idx=0)
      if (sector.idx === sectors.length - 1 && assignedAngle === 0)
        assignedAngle = Math.PI * 2;
      return !sector.encloses(assignedAngle);
    }
  }

  //TODO: Move this either to the halfedgeutils
  // or to the staircase generator?
  /**
   * Gets the closest associated angle (one bound of its associated sector)
   * of an unaligned deviating(!) edge in respect to its assigned angle.
   * Needed for constructing the staircase of an unaligned deviating edge.
   * @param halfEdge The halfedge of which to get the closest associated angle.
   * @param c The set of orientations used  for determining the associated angle.
   * @returns The closest associated angle of an {@link HalfEdge} in respect to its assigned angle.
   */
  private getClosestAssociatedAngle(halfEdge: HalfEdge, c: C) {
    const sectors = c.sectors;
    const associatedSector = getAssociatedSector(halfEdge, sectors);
    if (this.getClass(halfEdge) !== OrientationClasses.UD || !associatedSector)
      return; // TODO: error handling, this function is only meant to be used for unaligned deviating edges
    const sector = associatedSector[0];

    // TODO: refactor: find better solution for last sector and it's upper bound
    // set upperbound of last to Math.PI * 2 ?
    const upper = sector.idx === sectors.length - 1 ? 0 : sector.upper;
    const lower = sector.lower;
    const angle =
      this.getAssignedAngle(halfEdge, sectors) === 0
        ? Math.PI * 2
        : this.getAssignedAngle(halfEdge, sectors);

    return upper + c.sectorAngle === angle ? upper : lower;
  }

  /**
   * Gets the angle of the HalfEdge's assigned direction.
   * @returns The angle in radians.
   */
  private getAssignedAngle(halfEdge: HalfEdge, sectors: Sector[]) {
    const assignedDirection = this.assignedDirections.get(halfEdge.uuid);
    if (typeof assignedDirection !== "number") return;
    return Math.PI * 2 * (assignedDirection / sectors.length);
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
   * @returns An Array, holding the assigned directions starting with the direction of the {@link HalfEge} with the smallest angle on the unit circle.
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
