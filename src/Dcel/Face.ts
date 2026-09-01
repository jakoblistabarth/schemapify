import Polygon from "../geometry/Polygon";
import HalfEdge from "./HalfEdge";

class Face {
  id?: number;
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
   * Pointer to the outer ring the face belongs to.
   * Only defined for holes.
   */
  outerRing?: Face;

  /**
   * List of IDs of the associated features.
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
   * Get the face's unique identifier.
   * @returns the edge's uuid
   */
  get uuid() {
    // prefer numeric id when available
    if (typeof this.id === "number" && this.id > 0) return `f${this.id}`;
    const edgeId = this.edge?.uuid ?? "unbounded";
    return `${edgeId}-${this.associatedFeatures.join("-")}`;
  }

  /**
   * Get the face's outer ring.
   * @param counterclockwise whether the edges should be returned in counterclockwise order. Defaults to `true`.
   * @returns the face's outer ring
   */
  getEdges(counterclockwise: boolean = true) {
    return this.edge ? this.edge.getCycle(counterclockwise) : [];
  }

  /**
   * Gets the rings bounding the face: the one it is enclosed by, followed by the one
   * around each of its holes. Only the first is reachable through the face's own
   * edge, which is why a check of the face cycles alone leaves the holes unvisited.
   * @param counterclockwise Whether to walk the rings counterclockwise.
   * @returns One array of {@link HalfEdge}s per ring.
   */
  getRings(
    counterclockwise: boolean = true,
    visited = new Set<Face>(),
  ): HalfEdge[][] {
    if (visited.has(this)) return [];
    visited.add(this);

    const outerRing = this.getEdges(counterclockwise);
    return [
      ...(outerRing.length ? [outerRing] : []),
      ...this.innerEdges.flatMap((edge) => [
        edge.getCycle(counterclockwise),
        // A hole can enclose holes of its own, which bound this face just as much.
        ...(edge.face?.getRings(counterclockwise, visited).slice(1) ?? []),
      ]),
    ];
  }

  /**
   * Remove the face's inner edge.
   * @param the {@link HalfEdge} to be removed from the face's inner edges
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
   * Replace a face's inner edge.
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
