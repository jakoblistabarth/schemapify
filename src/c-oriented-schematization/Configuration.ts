import HalfEdge from "../DCEL/HalfEdge";
import Vertex from "../DCEL/Vertex";
import Line from "../geometry/Line";
import { crawlArray } from "../utilities";
import Contraction, { ContractionType } from "./Contraction";

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
    this[ContractionType.N] = Contraction.initialize(this, ContractionType.N);
    this[ContractionType.P] = Contraction.initialize(this, ContractionType.P);
  }

  getOuterEdge(position: OuterEdge): HalfEdge | undefined {
    return position === OuterEdge.PREV
      ? this.innerEdge.prev
      : this.innerEdge.next;
  }

  /**
   * Gets all 3 edges forming the configuration.
   * @returns An array of {@link HalfEdge}s.
   */
  getX(): HalfEdge[] {
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
  getX_(): HalfEdge[] {
    const x = this.getX();
    return x
      ? this.innerEdge.getCycle().filter((edge) => !x.includes(edge))
      : [];
  }

  /**
   * Get the track of the configuration for the indicated outer edge.
   * @param outerEdge The outer edge for which to get the track.
   * @returns A {@link Line} representing the track of the configuration.
   */
  getTrack(outerEdge: OuterEdge): Line | undefined {
    const [prev, next] = [
      this.getOuterEdge(OuterEdge.PREV),
      this.getOuterEdge(OuterEdge.NEXT),
    ];
    const prevAngle = prev?.getAngle();
    const nextAngle = next?.getAngle();
    const head = this.innerEdge.getHead();
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
  hasJunction(): boolean {
    return this.innerEdge.getEndpoints().some((p) => p.edges.length > 2);
  }

  getJunctionType(vertex: Vertex): Junction | undefined {
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
