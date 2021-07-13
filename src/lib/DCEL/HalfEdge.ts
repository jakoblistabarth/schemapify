import { v4 as uuid } from "uuid";
import Vertex from "./Vertex";
import Point from "../geometry/Point";
import Dcel from "./Dcel";
import Face from "./Face";
import Staircase from "../orientation-restriction/Staircase";

export enum EdgeClasses {
  AB = "alignedBasic",
  UB = "unalignedBasic",
  E = "evading",
  AD = "alignedDeviating",
  UD = "unalignedDeviating",
}

class HalfEdge {
  uuid: string;
  dcel: Dcel;
  tail: Vertex;
  twin: this;
  face: Face;
  prev: this;
  next: this;
  assignedDirection: number;
  isAligning: boolean;
  class: EdgeClasses;
  staircase: Staircase;

  constructor(tail: Vertex, dcel: Dcel) {
    this.uuid = uuid();
    this.dcel = dcel;
    this.tail = tail;
    this.twin = null;
    this.face = null;
    this.prev = null;
    this.next = null;
    this.isAligning = undefined;
    this.class = undefined;
    this.staircase = undefined; // TODO: move isAligning, class and staircase to more specific (i.e. "cHalfEdge") class?
  }

  static getKey(tail: Vertex, head: Vertex): string {
    return `${tail.getUuid(10)}/${head.getUuid(10)}`;
  }

  /**
   *
   * @param stop defines how many strings of the uuid are returned
   * @returns the edge's uuid
   */
  getUuid(length?: number) {
    return this.uuid.substring(0, length);
  }

  getTail(): this["tail"] {
    return this.tail;
  }

  getHead(): this["twin"]["tail"] {
    return this.twin.getTail();
  }

  getEndpoints(): Array<this["tail"] | this["twin"]["tail"]> {
    return [this.getTail(), this.getHead()];
  }

  getCycle(forwards: boolean = true): this[] {
    let currentEdge: this = this;
    const initialEdge: this = currentEdge;
    const halfEdges: this[] = [];

    do {
      halfEdges.push(currentEdge);
      currentEdge = forwards ? currentEdge.next : currentEdge.prev;
    } while (currentEdge != initialEdge);

    return halfEdges;
  }

  getAngle(): number {
    const vector = [this.twin.tail.x - this.tail.x, this.twin.tail.y - this.tail.y];
    const angle = Math.atan2(vector[1], vector[0]);
    return angle < 0 ? angle + 2 * Math.PI : angle;
  }

  getLength(): number {
    return this.getTail().distanceToVertex(this.getHead());
  }

  getMidpoint(): Point {
    const [x1, y1] = this.getTail().xy();
    const [x2, y2] = this.getHead().xy();

    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;

    return new Point(mx, my);
  }

  remove(): void {
    this.tail.removeIncidentEdge(this);
    this.dcel.removeHalfEdge(this);
    if (this.face.outerRing) this.face.outerRing.removeInnerEdge(this);
  }

  /**
   * Subdivides a halfedge by adding a new vertex between a halfedge's tail and head.
   * @credits adapted from [Doubly Connect Edge List (DCEL)](https://www2.cs.sfu.ca/~binay/813.2011/DCEL.pdf)
   * @param newPoint {@link Point} which should be added between the {@link HalfEdge}'s tail and head. default: the edge's midpoint
   * @returns the new {@link HalfEdge} which leads from the original {@link HalfEdge}'s tail to the newly created {@link Vertex}.
   */
  subdivide(newPoint: Point = this.getMidpoint()): this {
    const e = this;
    const et = e.twin;
    const f1 = e.face;
    const f2 = et.face;

    const a = e.next;
    const b = e.prev;
    const c = et.next;
    const d = et.prev;

    const [x, y] = newPoint.xy();
    const N = this.dcel.makeVertex(x, y);

    const et_ = this.dcel.makeHalfEdge(N, e.tail);
    const et__ = this.dcel.makeHalfEdge(et.tail, N);
    N.edges.sort();
    et_.next = c;
    et_.prev = et__;
    et_.face = f2;

    et__.next = et_;
    et__.prev = d;
    et__.face = f2;

    et.prev.next = et__;
    et.next.prev = et_;

    if (f2.edge !== null && !f1.outerRing) {
      // if f2 is not the unbounded face and f1 is not a hole
      f2.edge = et_;
    }

    if (f2.innerEdges) {
      f2.innerEdges.forEach((e) => {
        e.face.replaceOuterRingEdge(et, et_);
      });
    }

    if (f2.outerRing) {
      // if f2 is a hole
      f1.replaceInnerEdge(et, et_);
    }

    et.remove();

    const e_ = this.dcel.makeHalfEdge(e.tail, N);
    const e__ = this.dcel.makeHalfEdge(N, a.tail);
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

    if (f1.edge !== null && !f2.outerRing) f1.edge = e_; //FIXME: better to use undefined? if e is an clockwise-running edge incident to the unbounded face

    if (f1.innerEdges) {
      f1.innerEdges.forEach((e) => {
        e.face.replaceOuterRingEdge(e, e_);
      });
    }

    if (f1.outerRing) {
      // if f1 is a hole
      f2.replaceInnerEdge(e, e_);
    }

    e.remove();

    return e_;
  }

  distanceToEdge(edge: HalfEdge): number {
    const verticesThis = [this.getTail(), this.getHead()];
    const verticesEdge = [edge.getTail(), edge.getHead()];
    const distances = verticesThis.map((v) => v.distanceToEdge(edge));
    distances.push(...verticesEdge.map((v) => v.distanceToEdge(this)));
    return Math.min(...distances);
  }
}

export default HalfEdge;
