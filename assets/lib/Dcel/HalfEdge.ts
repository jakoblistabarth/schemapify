import { v4 as uuid } from "uuid";
import Vertex from "./Vertex";
import Point from "../Geometry/Point";
import Dcel from "./Dcel";
import Face from "./Face";
import Sector from "../OrientationRestriction/Sector";
import { getUnitVector } from "../utilities";
import Staircase from "../OrientationRestriction/Staircase";

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
  twin: HalfEdge;
  face: Face;
  prev: HalfEdge;
  next: HalfEdge;
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

  getTail(): Vertex {
    return this.tail;
  }

  getHead(): Vertex {
    return this.twin.tail;
  }

  getEndpoints(): Array<Vertex> {
    return [this.getTail(), this.getHead()];
  }

  getSignificantVertex(): Vertex | undefined {
    const endPoints = this.getEndpoints();
    return endPoints.find((v) => v.significant);
  }

  getCycle(forwards: boolean = true): Array<HalfEdge> {
    let currentEdge: HalfEdge = this;
    const initialEdge: HalfEdge = currentEdge;
    const halfEdges: Array<HalfEdge> = [];

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
   *
   * @credits adapted from https://www2.cs.sfu.ca/~binay/813.2011/DCEL.pdf
   * @param newPoint Point which should be added between the halfedge's tail and head, default: the edge's midpoint
   * @returns the new halfedge which leads from the original edge's tail to the newly created vertex
   */
  bisect(newPoint: Point = this.getMidpoint()): HalfEdge {
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

  subdivideToThreshold(threshold: number): void {
    const initialHalfEdge: HalfEdge = this;
    let currentHalfEdge: HalfEdge = initialHalfEdge;

    while (currentHalfEdge != initialHalfEdge.next) {
      if (currentHalfEdge.getLength() < threshold) {
        currentHalfEdge = currentHalfEdge.next;
      } else {
        const newHalfEdge: HalfEdge = currentHalfEdge.bisect();
        currentHalfEdge = newHalfEdge;
      }
    }
  }

  getAssociatedAngles(): number[] {
    const sectors = this.dcel.config.c.getSectors();
    const angle = this.getAngle();
    let directions: number[] = [];
    sectors.some(function (sector) {
      if (angle === sector.lower) {
        return directions.push(sector.lower);
      } else if (angle === sector.upper) {
        return directions.push(sector.upper);
      } else if (angle > sector.lower && angle < sector.upper) {
        return directions.push(sector.lower, sector.upper);
      }
    });

    return directions;
  }

  getAssignedAngle(): number {
    const sectors = this.dcel.config.c.getSectors();
    return Math.PI * 2 * (this.assignedDirection / sectors.length);
  }

  getAssignedDirection(): number {
    return this.assignedDirection;
  }

  getAssociatedSector(): Array<Sector> {
    const sectors = this.dcel.config.c.getSectors();
    const direction = this.getAssociatedAngles();
    return sectors.reduce((acc, sector) => {
      if (
        (direction[0] === sector.lower && direction[1] === sector.upper) ||
        +direction === sector.lower ||
        +direction === sector.upper ||
        +direction === sector.upper - Math.PI * 2
      ) {
        acc.push(sector);
      }
      return acc;
    }, []);
  }

  /**
   * Gets the closest associated angle (one bound of its associated sector)
   * of an unaligned deviating(!) edge in respect to its assigned angle.
   *
   * Needed for constructing the staircase of an unaligned deviating edge.
   *
   * @returns closest associated angle of an edge in respect to its assigned angle.
   */

  // TODO: Where does such function live?
  // within the HalfEdge class or rather within Staircase??
  getClosestAssociatedAngle(): number {
    if (this.class !== EdgeClasses.UD) return; // TODO: error handling, this function is only meant to be used for unaligned deviating edges
    const sector = this.getAssociatedSector()[0];

    // TODO: refactor: find better solution for last sector and it's upper bound
    // set upperbound of last to Math.PI * 2 ?
    const upper = sector.idx === this.dcel.config.c.getSectors().length - 1 ? 0 : sector.upper;
    const lower = sector.lower;
    const angle = this.getAssignedAngle() === 0 ? Math.PI * 2 : this.getAssignedAngle();

    return upper + this.dcel.config.c.getSectorAngle() === angle ? upper : lower;
  }

  isDeviating(): boolean {
    // an angle needs to be already set for this halfedge, TODO: Error handling?
    if (this.isAligned()) {
      return this.getAssociatedAngles()[0] !== this.getAssignedAngle();
    } else {
      let assignedAngle = this.getAssignedAngle();
      const sector = this.getAssociatedSector()[0];
      //TODO: refactor find better solution for last sector (idx=0)
      if (sector.idx === this.dcel.config.c.getSectors().length - 1 && assignedAngle === 0)
        assignedAngle = Math.PI * 2;
      return !sector.encloses(assignedAngle);
    }
  }

  isAligned(): boolean {
    const isAligned = this.getAssociatedAngles().length === 1;
    return (this.isAligning = isAligned);
  }

  distanceToEdge(edge: HalfEdge): number {
    const verticesThis = [this.getTail(), this.getHead()];
    const verticesEdge = [edge.getTail(), edge.getHead()];
    const distances = verticesThis.map((v) => v.distanceToEdge(edge));
    distances.push(...verticesEdge.map((v) => v.distanceToEdge(this)));
    return Math.min(...distances);
  }

  classify(): EdgeClasses {
    this.getTail().assignDirections();

    if (this.class) return; // do not overwrite classification
    if (this.getHead().significant) return; // do not classify a HalfEdge which has a significant head

    const sector = this.getAssociatedSector()[0];
    const significantVertex = this.getSignificantVertex() || this.getTail();
    const edges = significantVertex
      .getEdgesInSector(sector)
      .filter((edge) => !edge.isAligned() && !edge.isDeviating());

    let classification: EdgeClasses;
    if (this.isAligned()) {
      classification = this.isDeviating() ? EdgeClasses.AD : EdgeClasses.AB;
    } else if (this.isDeviating()) {
      classification = EdgeClasses.UD;
    } else if (edges.length == 2) {
      classification = EdgeClasses.E;
    } else {
      classification = EdgeClasses.UB;
    }

    this.class = classification;
    return (this.twin.class = classification);
  }

  getStepLengths(se: number, d1: number): number[] {
    //TODO: move getStepLenghts() to staircase ??
    const d2 = this.getAssociatedAngles().find((angle) => angle !== d1);
    const d1u = getUnitVector(d1);
    const d2u = getUnitVector(d2);

    // create vector of edge
    const [tail, head] = this.getEndpoints();
    const v = [head.x - tail.x, head.y - tail.y];
    const vse = v.map((point) => point / se);

    // solve linear equation for l1 and l2 with cramer's rule for 2x2 systems
    const det = d1u[0] * d2u[1] - d1u[1] * d2u[0];
    const detX = vse[0] * d2u[1] - vse[1] * d2u[0];
    const l1 = detX / det;
    const detY = d1u[0] * vse[1] - d1u[1] * vse[0];
    const l2 = detY / det;

    return [l1, l2];
  }

  /**
   * Gets the modified tail Vertex, which is used for calculating the edgeDistance between HalfEdges sharing one Vertex.
   * @param offsetEdge The edge of which a part should be ignored.
   * @param offset The distance the offset Vertex should be moved in respect to its (original) tail Vertex.
   * @returns The Vertex on the edge of which a part should be ignored and from where the edge is considered for calculating the edgeDistance.
   */
  getOffsetVertex(offsetEdge: HalfEdge, offset: number) {
    const pointOffset = offsetEdge.getTail().getNewPoint(offset, offsetEdge.getAngle());
    return new Vertex(pointOffset.x, pointOffset.y, undefined);
  }
}

export default HalfEdge;
