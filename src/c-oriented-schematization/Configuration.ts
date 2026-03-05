import HalfEdge from "../Dcel/HalfEdge";
import Vertex from "../Dcel/Vertex";
import Line from "../geometry/Line";
import { crawlArray } from "../utilities";
import Contraction from "./Contraction";
import { ContractionType } from "./ContractionType";

export enum OuterEdge {
  PREV = "prev",
  NEXT = "next",
}

export enum Junction {
  A = "aligned",
  B = "unalignedDifferentSide",
  C = "unalignedSameSide",
}

class Configuration {
  innerEdge: HalfEdge;
  [ContractionType.N]?: Contraction;
  [ContractionType.P]?: Contraction;

  constructor(edge: HalfEdge) {
    this.innerEdge = edge;
  }

  initialize(configurations: Map<string, Configuration>) {
    this[ContractionType.P] = Contraction.initialize(
      this,
      ContractionType.P,
      configurations,
    );
    this[ContractionType.N] = Contraction.initialize(
      this,
      ContractionType.N,
      configurations,
    );
  }

  /**
   * Gets either the previous or the next outer edge of the configuration (in regard to the inner edge).
   * @param position The relative position of the outerEdge in respect to the innerEdge.
   * @returns A {@link HalfEdge} representing the outerEdge.
   */
  getOuterEdge(position: OuterEdge) {
    return position === OuterEdge.PREV
      ? this.innerEdge.prev
      : this.innerEdge.next;
  }

  /**
   * Gets all 3 edges forming the configuration.
   * @returns An array of {@link HalfEdge}s.
   */
  get x() {
    const [prev, next] = [
      this.getOuterEdge(OuterEdge.PREV),
      this.getOuterEdge(OuterEdge.NEXT),
    ];
    return prev && next ? [prev, this.innerEdge, next] : [];
  }

  /**
   * Gets all edges of the polygon's boundary to which the configuration belongs, unless the 3 edges forming the configuration.
   * Kind of the inverse to getX().
   * @returns An array of {@link HalfEdge}s.
   */
  get x_() {
    const x = this.x;
    return x
      ? this.innerEdge.getCycle().filter((edge) => !x.includes(edge))
      : [];
  }

  get contractions() {
    return {
      [ContractionType.N]: this[ContractionType.N],
      [ContractionType.P]: this[ContractionType.P],
    };
  }

  /**
   * Get the track of the configuration for the indicated outer edge.
   * @param outerEdge The outer edge for which to get the track.
   * @returns A {@link Line} representing the track of the configuration.
   */
  getTrack(outerEdge: OuterEdge) {
    const [prev, next] = [
      this.getOuterEdge(OuterEdge.PREV),
      this.getOuterEdge(OuterEdge.NEXT),
    ];
    const prevAngle = prev?.getAngle();
    const nextAngle = next?.getAngle();
    const head = this.innerEdge.head;
    if (
      !prev ||
      !next ||
      typeof prevAngle !== "number" ||
      typeof nextAngle !== "number" ||
      !head
    )
      return;
    if (outerEdge === OuterEdge.PREV)
      return new Line(this.innerEdge.tail, prevAngle);
    else return new Line(head, nextAngle);
  }

  /**
   * Get the two tracks of the configuration.
   * @returns An array of {@link Line}s representing the two tracks of the configuration.
   */
  get tracks() {
    return [this.getTrack(OuterEdge.PREV), this.getTrack(OuterEdge.NEXT)];
  }

  /**
   * Get the intersection point of the two tracks of the configuration.
   * @returns A {@link Point} representing the intersection point of the two tracks of the configuration.
   */
  get trackIntersection() {
    const [prev, next] = this.tracks;
    if (!prev || !next) return;
    return prev?.intersectsLine(next);
  }

  /**
   * Checks if the configuration has a junction.
   * @returns A boolean indicating if the configuration has a junction.
   */
  get hasJunction() {
    return this.innerEdge.endpoints.some((p) => p.edges.length > 2);
  }

  /**
   * Get the junction type of the configuration.
   * @param vertex The vertex to check for the junction type.
   * @returns A {@link Junction} representing the junction type.
   */
  getJunctionType(vertex: Vertex) {
    if (!this.innerEdge.twin) return;
    let idx = vertex.edges.indexOf(this.innerEdge);
    idx = idx === -1 ? vertex.edges.indexOf(this.innerEdge.twin) : idx;
    const edge1 = crawlArray(vertex.edges, idx, +1);
    const edge2 = crawlArray(vertex.edges, idx, +2);

    if (edge1.getAngle() === edge2.twin?.getAngle()) return Junction.A;
    const normal = this.innerEdge.getVector()?.getNormal();
    if (!normal) return;

    const o1 = edge1.getVector()?.dot(normal);
    const o2 = edge2.getVector()?.dot(normal);
    if (!o1 || !o2) return;
    if ((o1 > 0 && o2 < 0) || (o1 < 0 && o2 > 0)) return Junction.B;
    else return Junction.C;
  }
}

export default Configuration;
