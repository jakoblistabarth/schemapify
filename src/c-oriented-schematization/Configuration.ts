import HalfEdge from "../Dcel/HalfEdge";
import Vertex from "../Dcel/Vertex";
import { EPSILON } from "../geometry/constants";
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
   * Gets both outer edges of the configuration.
   * @returns An array of {@link HalfEdge}s representing the outer edges.
   **/
  getOuterEdges() {
    const prev = this.getOuterEdge(OuterEdge.PREV);
    const next = this.getOuterEdge(OuterEdge.NEXT);
    return prev && next ? [prev, next] : [];
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
   * Gets all edges of the polygon's boundary to which the configuration belongs,
   * unless the 3 edges forming the configuration.
   * Kind of the inverse to {@link x()}.
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
  getTrack(outerEdge: OuterEdge, type: ContractionType) {
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

    const vertex = outerEdge === OuterEdge.PREV ? this.innerEdge.tail : head;
    // Where the inner edge meets a junction whose two other edges lie on either side
    // of it, the endpoint travels along whichever of them the edge moves towards,
    // rather than along the configuration's own outer edge. At a junction of type A
    // the two lie on one line with that outer edge, so it is the track either way.
    if (vertex.degree > 2 && this.getJunctionType(vertex) !== Junction.A) {
      const junctionTrack = this.getJunctionTrack(vertex, type);
      if (junctionTrack) return junctionTrack;
    }

    if (outerEdge === OuterEdge.PREV)
      return new Line(this.innerEdge.tail, prevAngle);
    else return new Line(head, nextAngle);
  }

  /**
   * Gets the inner edge as it leaves the specified one of its endpoints, so that its
   * direction can be compared with the other edges leaving there.
   * @param vertex One of the inner edge's endpoints.
   * @returns The {@link HalfEdge} pointing away from the vertex.
   */
  private getOutgoingInnerEdge(vertex: Vertex) {
    return vertex === this.innerEdge.tail
      ? this.innerEdge
      : this.innerEdge.twin;
  }

  /**
   * Gets the track a junction on the inner edge travels along, which is the edge it
   * heads towards as the inner edge moves.
   * @param vertex The junction the inner edge meets.
   * @param type The {@link ContractionType}, which decides the direction of the move.
   * @returns A {@link Line} representing the track, if there is one such edge.
   */
  private getJunctionTrack(vertex: Vertex, type: ContractionType) {
    const angle = this.getJunctionTrackEdge(vertex, type)?.getAngle();
    return typeof angle === "number" ? new Line(vertex, angle) : undefined;
  }

  /**
   * Gets the edge a junction on the inner edge travels along, which is the one of the
   * junction's other edges the inner edge moves towards.
   * @param vertex The junction the inner edge meets.
   * @param type The {@link ContractionType}, which decides the direction of the move.
   * @returns The {@link HalfEdge} leaving the junction on that side.
   */
  getJunctionTrackEdge(vertex: Vertex, type: ContractionType) {
    const innerEdgeVector = this.innerEdge.getVector()?.unitVector;
    if (!innerEdgeVector) return;
    // The side the inner edge moves towards, as the compensation's height measures it.
    const normal = innerEdgeVector.getNormal(type === ContractionType.N);
    const leading = vertex.edges.filter((edge) => {
      if (edge === this.innerEdge || edge === this.innerEdge.twin) return false;
      // Measured on the edge's direction rather than on the edge: an edge lying along
      // the inner edge points nowhere the move is going, however long it is.
      const direction = edge.getVector()?.unitVector;
      return direction ? direction.dot(normal) > EPSILON : false;
    });
    const inner = this.getOutgoingInnerEdge(vertex)?.getVector()?.unitVector;
    if (leading.length === 1 || !inner) return leading[0];
    // How far an edge departs from the inner edge, as the cosine of the angle
    // between the two: the closer to it, the larger.
    const closeness = (edge: HalfEdge) =>
      edge.getVector()?.unitVector.dot(inner) ?? -Infinity;

    // Both of the junction's other edges lead the way, which is the junction of type C
    // moved towards them. The vertex follows the one departing least from the inner
    // edge, the two of them enclosing the face the contraction eats into.
    if (leading.length > 1)
      return leading.reduce((closest, edge) =>
        closeness(edge) > closeness(closest) ? edge : closest,
      );

    // Neither leads the way, which is the junction of type C moved away from its
    // edges. The vertex travels out along the extension of the one departing most
    // from the inner edge, leaving out any which runs along it and so extends
    // nowhere the move is going.
    const trailing = vertex.edges.filter((edge) => {
      if (edge === this.innerEdge || edge === this.innerEdge.twin) return false;
      const departure = closeness(edge);
      return departure > -1 + EPSILON && departure < 1 - EPSILON;
    });
    if (!trailing.length) return;
    return trailing.reduce((furthest, edge) =>
      closeness(edge) < closeness(furthest) ? edge : furthest,
    );
  }

  /**
   * Get the two tracks of the configuration.
   * @param type The {@link ContractionType}, which decides the direction of the move.
   * @returns An array of {@link Line}s representing the two tracks of the configuration.
   */
  getTracks(type: ContractionType) {
    return [
      this.getTrack(OuterEdge.PREV, type),
      this.getTrack(OuterEdge.NEXT, type),
    ];
  }

  /**
   * Checks if the configuration has a junction.
   * @returns A boolean indicating if the configuration has a junction.
   */
  get hasJunction() {
    return this.innerEdge.endpoints.some((p) => p.degree > 2);
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

    const normal = this.innerEdge.getVector()?.unitVector.getNormal();
    if (!normal) return;

    const o1 = edge1.getVector()?.unitVector.dot(normal);
    const o2 = edge2.getVector()?.unitVector.dot(normal);
    // An edge square to the normal lies along the inner edge's own line, which is
    // neither side of it, so it counts among the ones on the same side.
    if (o1 === undefined || o2 === undefined) return;
    if ((o1 > 0 && o2 < 0) || (o1 < 0 && o2 > 0)) return Junction.B;
    else return Junction.C;
  }
}

export default Configuration;
