import { v4 as uuid } from "uuid";
import Polygon from "../geometry/Polygon";
import HalfEdge from "./HalfEdge";

class Face {
  /**
   * Unique ID.
   */
  uuid: string;

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
   * List of IDs of the associated features.
   * A face can be associated with up to 2 features:
   * it can server as an inner ring (hole) for one feature
   * and as an exterior ring for another.
   */
  associatedFeatures: number[];

  constructor() {
    this.uuid = uuid();
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
   * Get the face's uuid.
   * @param length defines how many strings of the uuid are returned
   * @returns the edge's uuid
   */
  getUuid(length?: number) {
    return this.uuid.substring(0, length);
  }

  getEdges(counterclockwise: boolean = true): HalfEdge[] {
    return this.edge ? this.edge.getCycle(counterclockwise) : [];
  }

  removeInnerEdge(edge: HalfEdge): HalfEdge[] {
    const idx = this.innerEdges.indexOf(edge);
    if (idx > -1) {
      this.innerEdges.splice(idx, 1);
    }
    return this.innerEdges;
  }

  replaceInnerEdge(old: HalfEdge, edge: HalfEdge): HalfEdge[] {
    const idx = this.innerEdges.indexOf(old);
    if (idx === -1) {
      return [];
    } else {
      this.innerEdges[idx] = edge;
    }
    return this.innerEdges;
  }

  replaceOuterRingEdge(old: HalfEdge, edge: HalfEdge): HalfEdge | undefined {
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
  getArea(): number | undefined {
    const edges = this.getEdges();
    if (!edges) return;
    const vertices = edges.map((edge) => edge.tail.toVector().toArray());
    return Polygon.fromCoordinates([vertices]).area;
  }
}

export default Face;
