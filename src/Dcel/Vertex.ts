import { v4 as uuid } from "uuid";
import Point from "../geometry/Point";
import Dcel from "./Dcel";
import Face from "./Face";
import HalfEdge from "./HalfEdge";
import C from "../c-oriented-schematization/C";

class Vertex extends Point {
  dcel: Dcel;
  uuid: string;
  edges: HalfEdge[];

  constructor(x: number, y: number, dcel: Dcel) {
    super(x, y);
    this.dcel = dcel;
    this.uuid = uuid();
    this.edges = [];
  }

  /**
   * Gets the key of a Vertex, based on its coordinates.
   * @param x The x coordinate of the {@link Vertex}.
   * @param y The y coordinate of the {@link Vertex}.
   * @returns A string, holding the {@link Vertex}'s key.
   */
  static getKey(x: number, y: number) {
    return `${x}/${y}`;
  }

  /**
   * Gets the unique ID of a Vertex.
   * @param stop Defines how many strings of the uuid are returned.
   * @returns A string, holding the {@link Vertex}'s unique ID.
   */
  getUuid(length?: number) {
    // QUESTION: extending classes instead of declaring this method separately for all 3 dcel entities?
    return this.uuid.substring(0, length);
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
    else if (this.edges.length > 2)
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
   * Assigns directions to all incident HalfEdges of the Vertex.
   * @returns An Array, holding the assigned directions starting with the direction of the {@link HalfEge} with the smallest angle on the unit circle.
   */
  assignDirections(c: C) {
    const edges = this.sortEdges(false);
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

    edges.forEach((edge, idx) => (edge.assignedDirection = solution[idx]));
    return solution;
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
    this.dcel.vertices.set(Vertex.getKey(x, y), this);
    this.dcel.vertices.delete(Vertex.getKey(this.x, this.y));
    this.x = x;
    this.y = y;
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
