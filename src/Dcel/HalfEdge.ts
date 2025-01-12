import Configuration from "../c-oriented-schematization/Configuration";
import Sector from "../c-oriented-schematization/Sector";
import Line from "../geometry/Line";
import LineSegment from "../geometry/LineSegment";
import Point from "../geometry/Point";
import Vector2D from "../geometry/Vector2D";
import Dcel from "./Dcel";
import Face from "./Face";
import Vertex from "./Vertex";

export enum InflectionType {
  C = "convex",
  R = "reflex",
  B = "both",
}

class HalfEdge {
  tail: Vertex;
  dcel: Dcel;
  twin?: HalfEdge;
  face?: Face;
  prev?: HalfEdge;
  next?: HalfEdge;

  constructor(tail: Vertex, dcel: Dcel) {
    this.tail = tail;
    this.dcel = dcel;
  }

  /**
   * Get the key of the HalfEdge.
   * @param tail The tail of the HalfEdge.
   * @param head The head of the HalfEdge.
   * @returns A string, representing the HalfEdge's key.
   */
  static getKey(tail: Vertex, head: Vertex): string {
    return `${tail.uuid}->${head.uuid}`;
  }

  /**
   * Get the unique identifier of the HalfEdge.
   * @param stop defines how many strings of the uuid are returned
   * @returns the edge's uuid
   */
  get uuid() {
    if (!this.head) return `${this.tail.uuid}->na`;
    return HalfEdge.getKey(this.tail, this.head);
  }

  /**
   * Gets the Head of the HalfEdge.
   * @returns A {@link Vertex}, representing the {@link HalfEdge}'s head.
   */
  get head() {
    if (this.twin) return this.twin.tail;
  }

  /**
   * Gets the Vertices of the HalfEdge.
   * @returns An array of {@link Vertex}s, representing the {@link HalfEdge}'s endpoints.
   */
  get endpoints() {
    const head = this.head;
    return head ? [this.tail, head] : [];
  }

  /**
   * Gets all HalfEdges incident to the same face as the HalfEdge.
   * @param forwards A Boolean indicating whether the {@link HalfEdge}s should be returned forward (counterclockwise)
   * or backwards (clockwise). Default: true.
   * @returns An array of {@link HalfEdge}s.
   */
  getCycle(forwards: boolean = true) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let currentEdge: HalfEdge = this;
    const initialEdge: HalfEdge = currentEdge;
    const halfEdges: HalfEdge[] = [];

    do {
      halfEdges.push(currentEdge);
      if (currentEdge.next && currentEdge.prev)
        currentEdge = forwards ? currentEdge.next : currentEdge.prev;
    } while (currentEdge != initialEdge);

    return halfEdges;
  }

  /**
   * Gets the minimum amount of steps it takes to get from the halfedge to another.
   * Looking at both directions, clock-wise and counter-clockwise.
   * @param other {@link HalfEdge} to which the distance in steps is measured.
   * @returns An integer, indicating the minimum step distance to the {@link Halfedge}.
   */
  getMinimalCycleDistance(other: HalfEdge) {
    const forwards = this.getCycle().indexOf(other);
    const backwards = this.getCycle(false).indexOf(other);
    return Math.min(forwards, backwards);
  }

  /**
   * Gets the Vector representation of the HalfEdge.
   * @returns A {@link Vector2D}, representing the {@link HalfEdge}'s direction.
   */
  getVector() {
    const [tail, head] = this.endpoints;
    if (tail && head) return new Vector2D(head.x - tail.x, head.y - tail.y);
  }

  /**
   * Returns an infinite Line going through the HalfEdge.
   * @returns A Line which includes the {@link HalfEdge}.
   */
  toLine() {
    const angle = this.getAngle();
    if (typeof angle !== "number") return;
    return new Line(this.tail, angle);
  }

  /**
   * Gets the angle of an HalfEdge in respect to the unit circle.
   * @returns The angle in radians.
   */
  getAngle() {
    const vector = this.getVector();
    if (!vector) return;
    const angle = Math.atan2(vector.dy, vector.dx);
    return angle < 0 ? angle + 2 * Math.PI : angle;
  }

  /**
   * Gets the length of the Halfedge.
   * @returns The Length.
   */
  getLength() {
    const head = this.head;
    if (head) return this.tail.distanceToVertex(head);
  }

  /**
   * Gets the midpoint of the HalfEdge.
   * @returns A {@link Point}, indicating the midpoint of the {@link HalfEdge}.
   */
  getMidpoint() {
    const head = this.head;
    if (!head) return;
    const [x1, y1] = this.tail.xy;
    const [x2, y2] = head.xy;

    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;

    return new Point(mx, my);
  }

  /**
   * Remove links of the halfEdge within the DCEL linkages.
   */
  remove() {
    this.tail.removeIncidentEdge(this);
    if (this.face?.outerRing) this.face.outerRing.removeInnerEdge(this);
    this.dcel?.removeHalfEdge(this);
  }

  /**
   * Subdivides a halfedge by adding a new vertex between a halfedge's tail and head.
   * @credits adapted from [Doubly Connect Edge List (DCEL)](https://www2.cs.sfu.ca/~binay/813.2011/DCEL.pdf)
   * @param newPoint {@link Point} which should be added between the {@link HalfEdge}'s tail and head. default: the edge's midpoint
   * @returns the new {@link HalfEdge} which leads from the original {@link HalfEdge}'s tail to the newly created {@link Vertex}.
   */
  subdivide(newPoint: Point | undefined = this.getMidpoint()) {
    if (!newPoint) return;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const e = this;
    const et = e.twin;
    if (!et) return;
    const f1 = e.face;
    const f2 = et.face;
    if (!f2 || !f1) return;

    const a = e.next;
    const b = e.prev;
    const c = et.next;
    const d = et.prev;
    if (!a || !b || !c || !d) return;

    const [x, y] = newPoint.xy;
    const N = this.dcel.addVertex(x, y);

    const et_ = this.dcel.addHalfEdge(N, e.tail);
    const et__ = this.dcel.addHalfEdge(et.tail, N);
    N.edges.sort();
    et_.next = c;
    et_.prev = et__;
    et_.face = f2;

    et__.next = et_;
    et__.prev = d;
    et__.face = f2;

    if (!et.prev || !et.next) return;
    et.prev.next = et__;
    et.next.prev = et_;

    if (f2.edge && !f1.outerRing) {
      // if f2 is not the unbounded face and f1 is not a hole
      f2.edge = et_;
    }

    f2.innerEdges.forEach((e) => {
      if (!e.face) return;
      e.face.replaceOuterRingEdge(et, et_);
    });

    if (f2.outerRing) {
      // if f2 is a hole
      f1.replaceInnerEdge(et, et_);
    }

    et.remove();

    const e_ = this.dcel.addHalfEdge(e.tail, N);
    const e__ = this.dcel.addHalfEdge(N, a.tail);
    N.edges.sort();
    e_.next = e__;
    e_.prev = b;
    e_.face = f1;

    e__.next = a;
    e__.prev = e_;
    e__.face = f1;

    b.next = e_;
    a.prev = e__;

    et_.twin = e_;
    e_.twin = et_;
    et__.twin = e__;
    e__.twin = et__;

    if (f1.edge && !f2.outerRing) f1.edge = e_; // if e is an clockwise-running edge incident to the unbounded face

    f1.innerEdges.forEach((e) => {
      if (!e.face) return;
      e.face.replaceOuterRingEdge(e, e_);
    });

    if (f1.outerRing) {
      // if f1 is a hole
      f2.replaceInnerEdge(e, e_);
    }

    e.remove();

    return e_;
  }

  /**
   * Moves an Halfedge to the specified tail's and head's position.
   * @param newTail {@link} A {@link Point}, indicating the new position of the {@link HalfEdge}'s tail.
   * @param newHead A {@link Point}, indicating the new position of the {@link HalfEdge}'s head.
   * @returns The just created {@link HalfEdge}.
   */
  move(newTail: Point, newHead: Point) {
    const head = this.head;
    const prevTail = this.prev?.tail;
    const nextHead = this.next?.head;
    if (!head || !nextHead || !prevTail) return;
    if (newHead.equals(nextHead)) {
      const newEdge = head.remove(this.face);
      return newEdge;
    } else head.moveTo(newHead.x, newHead.y);
    if (newTail.equals(prevTail)) {
      const newEdge = this.tail.remove(this.face);
      return newEdge;
    } else this.tail.moveTo(newTail.x, newTail.y);
  }

  /**
   * Get the intersection point of the HalfEdge and a line, if exists.
   * @credits Part that determines whether or not the point is on the line segment, was adapted from this [stack overflow answer](https://stackoverflow.com/a/17590923).
   * @param line The infinite {@link Line} the {@link HalfEdge} is intersected with.
   * @returns A {@Point} representing the intersection.
   */
  intersectsLine(line: Line) {
    const head = this.head;
    const P = this.toLine()?.intersectsLine(line);
    //TODO: check if the fact that intersectsLine returns undefined for parallel line
    // poses a problem for the case that the halfedge is part of the line
    if (!P || !head) return;
    if (P.isOnLineSegment(new LineSegment(this.tail, head))) return P;
  }

  /**
   * Determines the deviation of the HalfEdge in respect to its associated sector.
   * @param sector The {@link Sector} the deviation is calculated for.
   * @returns The deviation in radians.
   */
  getDeviation(sector: Sector) {
    const angle = this.getAngle();
    if (typeof angle !== "number") return;
    const diff = Math.abs(angle - sector.lower);
    return diff > Math.PI ? Math.abs(diff - Math.PI * 2) : diff;
  }

  /**
   * Gets the minimum distance between two HalfEdges.
   * @param otherEdge The {@link HalfEdge} the distance to is calculated.
   * @returns A number, indicating the minimum distance.
   */
  distanceToEdge(otherEdge: HalfEdge) {
    const head = this.head;
    const otherHead = otherEdge.head;
    if (!head || !otherHead) return;
    const verticesThis = [this.tail, head];
    const verticesEdge = [otherEdge.tail, otherHead];
    const distances = [
      ...verticesThis.map((v) => v.distanceToEdge(otherEdge)),
      ...verticesEdge.map((v) => v.distanceToEdge(this)),
    ].filter((distance): distance is number => !!distance);
    return Math.min(...distances);
  }

  /**
   * Converts the HalfEdge into its equivalent LineSegment.
   * @returns A {@link LineSegment}.
   */
  toLineSegment() {
    const head = this.head;
    if (head) return new LineSegment(this.tail, head);
  }

  /**
   * Determines the type of the HalfEdge depending on the convexity or reflexivity of its endpoints.
   * @returns A enum, indicating the inflection Type of the {@link HalfEdge}.
   */
  getInflectionType() {
    const head = this.head;
    if (!head || !this.face) return;
    const tailAngle = this.tail.getExteriorAngle(this.face);
    const headAngle = head.getExteriorAngle(this.face);
    if (!tailAngle || !headAngle) return;

    if (tailAngle > 0 && headAngle > 0) return InflectionType.C;
    else if (tailAngle < 0 && headAngle < 0) return InflectionType.R;
    else return InflectionType.B;
  }

  /**
   * Converts the halfedge into a short string. For debugging purposes.
   * @returns A string representing the {@link Halfedge}'s endpoints.
   */
  toString() {
    return this.endpoints.map((p) => p.xy.join("/")).join("->");
  }
}

export default HalfEdge;
