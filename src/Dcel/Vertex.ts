import Point from "../geometry/Point";
import Dcel from "./Dcel";
import Face from "./Face";
import HalfEdge from "./HalfEdge";

class Vertex extends Point {
  dcel: Dcel;
  edges: HalfEdge[];
  id?: number;

  constructor(x: number, y: number, dcel: Dcel) {
    super(x, y);
    this.dcel = dcel;
    this.edges = [];
  }

  /**
   * Gets the key of a Vertex, based on its coordinates.
   * @param x The x coordinate of the {@link Vertex}.
   * @param y The y coordinate of the {@link Vertex}.
   * @returns A string, holding the {@link Vertex}'s key.
   */
  static getKey(x: number, y: number) {
    return `${x}|${y}`;
  }

  /**
   * Gets the unique ID of a Vertex.
   */
  get uuid() {
    // Use numeric id based unique identifier when available
    return typeof this.id === "number" && this.id > 0
      ? `v${this.id}`
      : Vertex.getKey(this.x, this.y);
  }

  /**
   * Gets the number of incident HalfEdges of the Vertex.
   * @returns The degree of the {@link Vertex}.
   */
  get degree() {
    return this.edges.length;
  }

  /**
   * Gets the distance between the Vertex to another.
   * @param p The other {@link Vertex}.
   * @returns The distance.
   */
  distanceToVertex(vertex: Vertex) {
    return this.distanceToPoint(vertex);
  }

  /**
   * Gets the (minimum) distance between the Vertex and a HalfEdge.
   * @credits Adapted from [scottglz](https://github.com/scottglz/distance-to-line-segment/blob/master/index.js)
   * @param edge An {@link HalfEdge} to which the distance is measured.
   * @returns The distance.
   */
  distanceToEdge(edge: HalfEdge) {
    const linesegment = edge.toLineSegment();
    if (!linesegment) return;
    return this.distanceToLineSegment(linesegment);
  }

  /**
   * Sorts the incident HalfEdges of the Vertex, either clockwise or counter-clockwise
   * @param clockwise If set to true (default), the {@link HalfEdge}s a sorted clockwise, if set to false they are sorted counter-clockwise.
   * @returns An array containing the sorted {@link HalfEdge}s.
   */
  sortEdges(clockwise: boolean = true) {
    this.edges.sort((a, b) => {
      const [angleA, angleB] = [a.getAngle(), b.getAngle()];
      if (typeof angleA !== "number" || typeof angleB !== "number") return 0;
      if (clockwise) return angleB - angleA;
      else return angleA - angleB;
    });
    return this.edges;
  }

  /**
   * Removes the vertex and replaces the incident HalfEdges with a new one.
   * Only works on vertices of degree 2 (with a maximum of two incident {@link HalfEdge}s).
   * @param face The face to which the new, returned {@link HalfEdge} should be incident to.
   * @returns The new ("merged") {@link HalfEdge}.
   */
  remove(face?: Face) {
    if (!this.dcel) return;
    else if (this.degree > 2)
      throw new Error(
        "only vertices of degree 2 or less can be removed, otherwise the topology would be corrupted",
      );
    else if (this.dcel.vertices.size === 3)
      throw new Error("a dcel must not have less than 3 vertices");

    const ex__ = this.edges[0];
    const ex_ = ex__.prev;

    const a = ex_?.prev;
    const b = ex_?.twin?.next;
    const c = ex__.next;
    const d = ex__.twin?.prev;

    const f1 = ex__.face;
    const f2 = ex__.twin?.face;

    const eTail = a?.head;
    const eHead = c?.tail;

    if (
      !ex__?.twin ||
      !ex_?.twin ||
      !eTail ||
      !eHead ||
      !f1 ||
      !f2 ||
      !a ||
      !b ||
      !c ||
      !d
    )
      return;
    const e = this.dcel.addHalfEdge(eTail, eHead);
    e.twin = this.dcel.addHalfEdge(eHead, eTail);
    e.twin.twin = e;

    if (f1?.edge === ex__ || f1.edge === ex_) f1.edge = e;
    if (f2?.edge === ex__.twin || f2.edge === ex_?.twin) f2.edge = e.twin;

    f1.replaceInnerEdge(ex__, e);
    f1.replaceInnerEdge(ex_, e);
    f1.replaceInnerEdge(ex__.twin, e.twin);
    f1.replaceInnerEdge(ex_.twin, e.twin);

    f2.replaceInnerEdge(ex__, e);
    f2.replaceInnerEdge(ex_, e);
    f2.replaceInnerEdge(ex__.twin, e.twin);
    f2.replaceInnerEdge(ex_.twin, e.twin);

    e.face = ex__.face;
    e.twin.face = ex__.twin.face;

    e.next = c;
    c.prev = e;
    e.prev = a;
    a.next = e;

    e.twin.prev = d;
    d.next = e.twin;
    e.twin.next = b;
    b.prev = e.twin;

    ex_.twin.remove();
    ex_.remove();
    ex__.twin.remove();
    ex__.remove();
    this.dcel.removeVertex(this);

    return face && e.face !== face ? e.twin : e;
  }

  /**
   * Hands one of the Vertex's incident HalfEdges over to a new Vertex, placed on
   * another of them, and leaves the rest where they are.
   *
   * The edge which moves takes the new vertex, the edges which stay keep this one, and
   * the piece of track they are split apart along joins the two.
   * @param edge The incident {@link HalfEdge} to hand over.
   * @param track The incident {@link HalfEdge} to place the new {@link Vertex} on.
   * @param point Where on the track the new {@link Vertex} goes.
   * @returns The new {@link Vertex}, or nothing if it could not be placed.
   */
  splitOff(edge: HalfEdge, track: HalfEdge, point: Point) {
    if (edge.tail !== this || track.tail !== this || edge === track) return;

    // The piece of the track between this vertex and the new one, which the boundary
    // reaches the handed over edge through from here on.
    const piece = track.subdivide(point);
    const split = piece?.head;
    if (!piece || !split) return;

    this.removeIncidentEdge(edge);
    edge.tail = split;
    split.edges.push(edge);

    // Which faces the two vertices lie between follows from the order of the edges
    // around them, which the handover has changed for both.
    [this as Vertex, split].forEach((vertex) => vertex.rewire());

    // Only the two pieces of the track can bound a face other than the one they were
    // cut out of, the handed over edge keeping the faces it already had. Each of them
    // takes the face of the first edge along the boundary which did not move.
    const rest = split.edges.find((incident) => incident !== piece.twin);
    const pieces = [piece, piece.twin, rest, rest?.twin].filter(
      (incident) => incident !== undefined,
    );
    pieces.forEach((incident) => {
      let following = incident.next;
      while (following && following !== incident && pieces.includes(following))
        following = following.next;
      if (!following?.face || following.face === incident.face) return;

      const left = incident.face;
      incident.face = following.face;
      // A face reached through a piece which has changed sides has to be reached
      // through one of the edges it kept instead.
      if (left?.edge === incident)
        left.edge = this.dcel
          .getHalfEdges()
          .find((candidate) => candidate.face === left);
    });

    return split;
  }

  /**
   * Derives the next and prev pointers of the Vertex's incident HalfEdges from the
   * order they sit around it in.
   */
  private rewire() {
    this.sortEdges();
    this.edges.forEach((edge, index) => {
      const next = this.edges[(index + 1) % this.degree];
      if (!edge.twin) return;
      edge.twin.next = next;
      next.prev = edge.twin;
    });
  }

  /**
   * Removes the specified halfedge from the Array of incident Halfedges of the vertex.
   * @param edge The {@link HalfEdge} to be removed.
   * @returns An Array containing the remaining incident {@link HalfEdge}s.
   */
  removeIncidentEdge(edge: HalfEdge) {
    const idx = this.edges.indexOf(edge);
    if (idx > -1) {
      this.edges.splice(idx, 1);
    }
    return this.edges;
  }

  /**
   * Returns the exterior angle of a DCEL's Vertex.
   * If the {@link Vertex} is convex the exterior angle is positive, if it is reflex, the angle is negative.
   * @param face A {@link Face} the angle is exterior to.
   * @returns An angle in radians.
   */
  getExteriorAngle(face: Face) {
    const interiorAngle = this.getInteriorAngle(face);
    if (interiorAngle) return Math.PI - interiorAngle;
  }

  /**
   * Returns the interior angle of a DCEL's Vertex.
   * It is always positive.
   * @credits Adapted from this [stack overflow answer](https://stackoverflow.com/a/12090743).
   * @param face A {@link Face} the angle is interior to.
   * @returns An angle in radians.
   */
  getInteriorAngle(face: Face) {
    const outgoing = this.edges.find((edges) => edges.face === face);
    if (!outgoing?.prev) return;
    const incoming = outgoing.prev;
    if (!incoming) return;
    const vIncoming = incoming.getVector();
    const vOutgoing = outgoing.getVector();
    return !vIncoming || !vOutgoing
      ? undefined
      : Math.PI -
          Math.atan2(
            vIncoming.dx * vOutgoing.dy - vOutgoing.dx * vIncoming.dy,
            vIncoming.dx * vOutgoing.dx + vIncoming.dy * vOutgoing.dy,
          );
  }

  /**
   * Moves the Vertex to a new position.
   * @param x A number, indicating the new x position of the {@link Vertex}.
   * @param y A number, indicating the new y position of the {@link Vertex}.
   * @returns The moved {@link Vertex}.
   */
  moveTo(x: number, y: number) {
    if (this.x === x && this.y === y) return this;
    // If a vertex already exists at the target position, merge into it by
    // reassigning all incident edges to the existing vertex, then removing
    // this vertex from the DCEL.
    // We can't call this.remove() here because it completely removes the vertex
    // and rewires its edges. This would break any references to those edges that
    // are needed within this method.
    const existing = this.dcel.findVertex(x, y);
    if (existing) {
      this.edges.forEach((edge) => {
        if (edge.tail === this) edge.tail = existing;
        if (edge.twin && edge.twin.tail === this) edge.twin.tail = existing;
        if (!existing.edges.includes(edge)) existing.edges.push(edge);
      });
      this.edges = [];
      this.dcel.removeVertex(this);

      // Remove any self-loop edges created by the merge (tail === head === existing).
      // prev and next pointer must be rewired manually before removal
      // since HalfEdge.remove() does not touch those pointers.
      const degenerate = existing.edges.filter((e) => e.head === existing);
      degenerate.forEach((e) => {
        if (e.prev) e.prev.next = e.next;
        if (e.next) e.next.prev = e.prev;
        if (e.face?.edge === e) e.face.edge = e.next ?? e.prev;
        if (e.twin) {
          if (e.twin.prev) e.twin.prev.next = e.twin.next;
          if (e.twin.next) e.twin.next.prev = e.twin.prev;
          if (e.twin.face?.edge === e.twin)
            e.twin.face.edge = e.twin.next ?? e.twin.prev;
        }
        // Removed through the half edge itself, which also gives up the edge's
        // registration as the inner edge of an enclosing face. Left registered, it
        // is walked as the start of that face's hole long after it is gone.
        e.remove();
      });

      return existing;
    }

    const oldX = this.x;
    const oldY = this.y;
    this.x = x;
    this.y = y;
    if (typeof this.id === "number" && this.id > 0)
      this.dcel.vertices.set(this.id, this);
    this.dcel.updateVertexPosition(this, oldX, oldY, x, y);
    return this;
  }

  /**
   * Converts a Vertex to a Point.
   * @returns A {@link Point}.
   */
  toPoint() {
    return new Point(this.x, this.y);
  }
}

export default Vertex;
