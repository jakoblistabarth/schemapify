import Polygon from "../geometry/Polygon";
import HalfEdge from "./HalfEdge";

class Face {
  /**
   * Pointer to an arbitrary edge of the outer connected component (boundary).
   * The edge is undefined for the unbounded face.
   */
  edge?: HalfEdge;

  /**
   * An array of edge pointers.
   * Each pointer represents an inner connected component (hole).
   */
  innerEdges: HalfEdge[];

  /**
   * Pointer to the outerRing the face belongs to.
   * Only defined for holes.
   */
  outerRing?: Face;

  /**
   * List of Ids of the associated features.
   * A face can be associated with up to 2 features of the input data:
   * it can serve as an inner ring (hole) for one feature and as an exterior ring for another.
   */
  associatedFeatures: number[];

  constructor() {
    this.associatedFeatures = [];
    this.innerEdges = [];
  }

  /**
   * Check if the face is a hole.
   * @returns A boolean, indicating whether the face is a hole.
   */
  get isHole() {
    return !!this.outerRing;
  }

  /**
   * Check if the face is unbounded.
   * @returns A boolean, indicating whether the face is unbounded.
   */
  get isUnbounded() {
    return !this.edge;
  }

  /**
   * Type guard to check if the face is bounded.
   * @returns A boolean, indicating whether the face is bounded.
   */
  static isBounded(face: Face): face is Face & { edge: HalfEdge } {
    return !face.isUnbounded;
  }

  /**
   * Get the face's uuid.
   * @returns the edge's uuid
   */
  get uuid() {
    // fallback string for unbounded face
    const edgeId = this.edge?.uuid ?? "unbounded";
    return `${edgeId}-${this.associatedFeatures.join("-")}`;
  }

  /**
   * Get the face's outer ring.
   * @returns the face's outer ring
   */
  getEdges(counterclockwise: boolean = true) {
    return this.edge ? this.edge.getCycle(counterclockwise) : [];
  }

  /**
   * Remove the face's inner edge.
   * @returns the face's remaining inner edges
   */
  removeInnerEdge(edge: HalfEdge) {
    const idx = this.innerEdges.indexOf(edge);
    if (idx > -1) {
      this.innerEdges.splice(idx, 1);
    }
    return this.innerEdges;
  }

  /**
   * Replace an face's inner edge.
   * @param old the {@link HalfEdge} to be replaced
   * @param edge the new {@link HalfEdge}
   * @returns the updated face's inner {@link HalfEdge}s
   */
  replaceInnerEdge(old: HalfEdge, edge: HalfEdge) {
    const idx = this.innerEdges.indexOf(old);
    if (idx === -1) {
      return [];
    } else {
      this.innerEdges[idx] = edge;
    }
    return this.innerEdges;
  }

  /**
   * Replace the face's outer ring edge.
   * @param old the {@link HalfEdge} to be replaced
   * @param edge the {@link HalfEdge} to replace the old {@link HalfEdge}
   * @returns the updated outer ring {@link HalfEdge}
   */
  replaceOuterRingEdge(old: HalfEdge, edge: HalfEdge) {
    if (!this.outerRing || this.outerRing.edge != old) {
      return;
    } else {
      this.outerRing.edge = edge;
      return this.outerRing.edge;
    }
  }

  /**
   * Get the Area of the face.
   * @returns A number, indicating the size of the {@link Face}.
   */
  getArea() {
    const edges = this.getEdges();
    if (!edges) return;
    const vertices = edges.map((edge) => edge.tail.xy);
    return Polygon.fromCoordinates([vertices]).area;
  }
}

export default Face;
