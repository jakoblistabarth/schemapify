import Dcel from "../Dcel/Dcel";
import HalfEdge from "../Dcel/HalfEdge";
import Classifier from "../Schematization/Classifier";
import C from "./C";
import Sector from "./Sector";
import { getEdgesInSector } from "./VertexUtils";

export enum OrientationClasses {
  AB = "alignedBasic",
  UB = "unalignedBasic",
  E = "evading",
  AD = "alignedDeviating",
  UD = "unalignedDeviating",
}

class HalfEdgeClassifier implements Classifier {
  c: C;
  significantVertices: string[];
  halfEdgeClasses: Map<string, OrientationClasses>;

  constructor(c: C, significantVertices: string[]) {
    this.c = c;
    this.significantVertices = significantVertices;
    this.halfEdgeClasses = new Map();
  }

  /**
   * Classifies all Vertices in the DCEL.
   * @param input The DCEL to classify.
   */
  public run(input: Dcel) {
    return input.getHalfEdges().reduce<Map<string, string>>((acc, e) => {
      const classification = this.classify(e, this.c, this.significantVertices);
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
    halfEdge.tail.assignDirections(c);

    // do not overwrite classification
    if (this.getClass(halfEdge)) return;

    // do not classify a HalfEdge which has a significant head
    const head = halfEdge.head;
    if (head && significantVertices.includes(head.uuid)) return;

    const sectors = c.sectors;
    const associatedSector = halfEdge.getAssociatedSector(sectors);
    const sector = associatedSector[0];
    const significantVertex =
      this.getSignificantVertex(halfEdge) || halfEdge.tail;
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
   * Gets the significant Vertex of the HalfEdge.
   * A Vertex is significant if its incident Edges reside in the same sector or adjacent sectors.
   * @param halfEdge The HalfEdge to get the significant Vertex from.
   * @returns The significant {@link Vertex} of the {@link HalfEdge}, if it exists.
   */
  private getSignificantVertex(halfEdge: HalfEdge) {
    const endPoints = halfEdge.endpoints;
    if (endPoints)
      return endPoints.find((v) => this.significantVertices.includes(v.uuid));
  }

  /**
   * Determines whether the HalfEdge is aligned to one of the orientations of C.
   * @returns A boolean, indicating whether or not the {@link HalfEdge} is aligned.
   */
  private isAligned(halfEdge: HalfEdge, sectors: Sector[]) {
    return halfEdge.getAssociatedAngles(sectors).length === 1;
  }

  /**
   * Determines whether the HalfEdge's assigned Direction is adjacent to its associated sector.
   * @returns A boolean, indicating whether or not the {@link HalfEdge} is deviating.
   */
  private isDeviating(halfEdge: HalfEdge, sectors: Sector[]) {
    let assignedAngle = this.getAssignedAngle(sectors);
    if (typeof assignedAngle !== "number") return false;
    if (this.isAligned(halfEdge, sectors)) {
      return (
        this.getAssociatedAngles(sectors)[0] !== this.getAssignedAngle(sectors)
      );
    } else {
      const sector = this.getAssociatedSector(sectors)[0];
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
}

export default HalfEdgeClassifier;
