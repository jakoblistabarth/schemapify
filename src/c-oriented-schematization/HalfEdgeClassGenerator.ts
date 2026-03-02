import Dcel from "../Dcel/Dcel";
import HalfEdge from "../Dcel/HalfEdge";
import Vertex from "../Dcel/Vertex";
import Generator from "../Schematization/Generator";
import C from "./C";
import {
  getAssociatedSector,
  getSignificantVertex,
  isAligned,
  isDeviating,
} from "./HalfEdgeUtils";
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
  significantVertices: number[];
  halfEdgeClasses: Map<number, Orientation>;
  assignedDirections: Map<number, number>;

  constructor(c: C, significantVertices: number[]) {
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
        Map<number, { orientation: Orientation; assignedDirection: number }>
      >((acc, edge) => {
        const orientation = this.classify(
          edge,
          this.c,
          this.significantVertices,
        );
        const assignedDirection =
          typeof edge.id === "number" && edge.id > 0
            ? this.assignedDirections.get(edge.id)
            : undefined;
        if (orientation && (assignedDirection || assignedDirection === 0)) {
          if (typeof edge.id === "number" && edge.id > 0)
            acc.set(edge.id, { orientation, assignedDirection });
          if (
            edge.twin &&
            typeof edge.twin.id === "number" &&
            edge.twin.id > 0
          ) {
            acc.set(edge.twin.id, { orientation, assignedDirection });
          }
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
  private classify(halfEdge: HalfEdge, c: C, significantVertices: number[]) {
    this.assignDirections(halfEdge.tail, c);

    // do not overwrite classification
    if (this.getClass(halfEdge)) return;

    // do not classify a HalfEdge which has a significant head
    const head = halfEdge.head;
    if (
      head &&
      typeof head.id === "number" &&
      significantVertices.includes(head.id)
    )
      return;
    const assignedDirection =
      typeof halfEdge.id === "number" && halfEdge.id > 0
        ? this.assignedDirections.get(halfEdge.id)
        : undefined;
    if (!assignedDirection && assignedDirection !== 0) return;
    const associatedSector = getAssociatedSector(halfEdge, c.sectors);
    const sector = associatedSector[0];
    const significantVertex =
      getSignificantVertex(halfEdge, this.significantVertices) || halfEdge.tail;
    const edges = getEdgesInSector(significantVertex, sector).filter((edge) => {
      const direction =
        typeof edge.id === "number" && edge.id > 0
          ? this.assignedDirections.get(edge.id)
          : undefined;
      if (typeof direction !== "number") return;
      const edgeIsAligned = isAligned(edge, c.sectors);
      const edgeIsDeviating = isDeviating(edge, c.sectors, direction);
      return !edgeIsAligned && !edgeIsDeviating;
    });

    let classification: Orientation;
    if (isAligned(halfEdge, c.sectors)) {
      classification = isDeviating(halfEdge, c.sectors, assignedDirection)
        ? Orientation.AD
        : Orientation.AB;
    } else if (isDeviating(halfEdge, c.sectors, assignedDirection)) {
      classification = Orientation.UD;
    } else if (edges.length == 2) {
      classification = Orientation.E;
    } else {
      classification = Orientation.UB;
    }

    return classification;
  }

  /**
   * Gets the assigned angle of the HalfEdge.
   * @param halfEdge The HalfEdge to get the class from.
   * @returns The assigned angle of the {@link HalfEdge}, if it exists.
   * */
  private getClass(halfEdge: HalfEdge) {
    return typeof halfEdge.id === "number" && halfEdge.id > 0
      ? this.halfEdgeClasses.get(halfEdge.id)
      : undefined;
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

    edges.forEach((edge, idx) => {
      if (typeof edge.id === "number" && edge.id > 0)
        this.assignedDirections.set(edge.id, solution[idx]);
    });
    return solution;
  }
}

export default HalfEdgeClassGenerator;
