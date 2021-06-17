import { v4 as uuid } from "uuid";
import Vertex, { Significance } from "./Vertex";
import Point from "../Geometry/Point";
import Dcel from "./Dcel";
import Face from "./Face";
import Sector from "../OrientationRestriction/Sector";

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
  assignedAngle: number;
  isAligning: boolean;
  class: EdgeClasses;

  constructor(tail: Vertex, dcel: Dcel) {
    this.uuid = uuid();
    this.dcel = dcel;
    this.tail = tail;
    this.twin = null;
    this.face = null;
    this.prev = null;
    this.next = null;
    this.assignedAngle = null;
    this.isAligning = null;
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

    f1.edge = e_;

    if (f1.outerRing) {
      //if f1 is a hole
      f2.replaceInnerEdge(e, e_);
    }
    if (f1.innerEdges) {
      f1.innerEdges.forEach((e) => {
        e.face.replaceOuterRingEdge(e, e_);
      });
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

  getAssociatedDirections(): number[] {
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

  getAssociatedSector(): Array<Sector> {
    const sectors = this.dcel.config.c.getSectors();
    const direction = this.getAssociatedDirections();
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

  getSignificantEndpoint(): Vertex {
    const endpoints = this.getEndpoints();
    const significantEndpoint =
      endpoints.find(
        (vertex) => vertex.significance === Significance.S || vertex.significance === Significance.T
      ) || endpoints[Math.round(Math.random())];
    if (significantEndpoint.significance === Significance.I)
      significantEndpoint.significance = Significance.T;
    return significantEndpoint;
  }

  isDeviating(): boolean {
    const sectors = this.dcel.config.c.getSectors();
    //TODO: refactor isDeviating(), find better solution for last sector (idx=0) should be 8???
    let assignedAngle = (this.assignedAngle * Math.PI * 2) / sectors.length;

    if (this.isAligned()) {
      return this.getAssociatedDirections()[0] !== assignedAngle;
    } else {
      const sector = this.getAssociatedSector()[0];
      if (sector.idx === sectors.length - 1) {
        assignedAngle = assignedAngle === 0 ? Math.PI * 2 : assignedAngle;
      }
      return !sector.encloses(assignedAngle);
    }
  }

  isAligned(): boolean {
    const isAligned = this.getAssociatedDirections().length === 1;
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
    let classification;

    if (this.twin.class) {
      classification = this.twin.class;
      return (this.class = classification);
    }

    const significantEndpoint = this.getSignificantEndpoint();
    significantEndpoint.assignAngles();

    const sector = this.getAssociatedSector()[0];
    const edges = significantEndpoint
      .getEdgesInSector(sector)
      .filter((edge) => !edge.isAligned() && !edge.isDeviating());

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
}

export default HalfEdge;
