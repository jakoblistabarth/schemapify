import { v4 as uuid } from "uuid";
import Vertex from "./Vertex";
import Dcel from "./Dcel";
import Face from "./Face";
import Sector from "../c-oriented-schematization/Sector";
import { getUnitVector } from "../utilities";
import Staircase from "../c-oriented-schematization/Staircase";
import Configuration from "../c-oriented-schematization/Configuration";
import Point from "../geometry/Point";
import Line from "../geometry/Line";
import LineSegment from "../geometry/LineSegment";
import Vector2D from "../geometry/Vector2D";

export enum OrientationClasses {
  AB = "alignedBasic",
  UB = "unalignedBasic",
  E = "evading",
  AD = "alignedDeviating",
  UD = "unalignedDeviating",
}

export enum InflectionType {
  C = "convex",
  R = "reflex",
  B = "both",
}

class HalfEdge {
  uuid: string;
  tail: Vertex;
  dcel: Dcel;
  twin?: HalfEdge;
  face?: Face;
  prev?: HalfEdge;
  next?: HalfEdge;
  assignedDirection?: number;
  isAligning?: boolean;
  class?: OrientationClasses;
  staircase?: Staircase;
  configuration?: Configuration;

  constructor(tail: Vertex, dcel: Dcel) {
    this.uuid = uuid();
    this.tail = tail;
    this.dcel = dcel;
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

  getHead(): Vertex | undefined {
    if (this.twin) return this.twin.tail;
  }

  getEndpoints(): Vertex[] {
    const head = this.getHead();
    return head ? [this.tail, head] : [];
  }

  getSignificantVertex(): Vertex | undefined {
    const endPoints = this.getEndpoints();
    if (endPoints) return endPoints.find((v) => v.significant);
  }

  /**
   * Gets all HalfEdges incident to the same face as the HalfEdge.
   * @param forwards A Boolean indicating whether the {@link HalfEdge}s should be returned forward (counterclockwise)
   * or backwards (clockwise). Default: true.
   * @returns An array of {@link HalfEdge}s.
   */
  getCycle(forwards: boolean = true): HalfEdge[] {
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

  getVector(): Vector2D | undefined {
    const [tail, head] = this.getEndpoints();
    if (tail && head) return new Vector2D(head.x - tail.x, head.y - tail.y);
  }

  /**
   * Returns an infinite Line going through the HalfEdge.
   * @returns A Line which includes the {@link HalfEdge}.
   */
  toLine(): Line | undefined {
    const angle = this.getAngle();
    if (typeof angle !== "number") return;
    return new Line(this.tail, angle);
  }

  /**
   * Gets the angle of an HalfEdge in respect to the unit circle.
   * @returns The angle in radians.
   */
  getAngle(): number | undefined {
    const vector = this.getVector();
    if (!vector) return;
    const angle = Math.atan2(vector.dy, vector.dx);
    return angle < 0 ? angle + 2 * Math.PI : angle;
  }

  /**
   * Gets the length of the Halfedge.
   * @returns The Length.
   */
  getLength(): number | undefined {
    const head = this.getHead();
    if (head) return this.tail.distanceToVertex(head);
  }

  /**
   * Gets the midpoint of the HalfEdge.
   * @returns A {@link Point}, indicating the midpoint of the {@link HalfEdge}.
   */
  getMidpoint(): Point | undefined {
    const head = this.getHead();
    if (!head) return;
    const [x1, y1] = this.tail.xy();
    const [x2, y2] = head.xy();

    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;

    return new Point(mx, my);
  }

  /**
   * Deletes the halfEdge and possible other occurrences in the DCEL linkages.
   */
  remove(): void {
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
  subdivide(newPoint: Point | undefined = this.getMidpoint()): HalfEdge | undefined {
    if (!newPoint) return;
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

    if (f1.edge && !f2.outerRing) f1.edge = e_; //FIXME: better to use undefined? if e is an clockwise-running edge incident to the unbounded face

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
   * Returns the intersection point of the HalfEdge and a line, if exists.
   * @credits Part that determines whether or not the point is on the line segment, was adapted from this [stack overflow answer](https://stackoverflow.com/a/17590923).
   * @param line The infinite {@link Line} the {@link HalfEdge} is intersected with.
   * @returns
   */
  intersectsLine(line: Line): Point | undefined {
    const head = this.getHead();
    const P = this.toLine()?.intersectsLine(line);
    //TODO: check if the fact that intersectsLine returns undefined for parallel line
    // poses a problem for the case that the halfedge is part of the line
    if (!P || !head) return;
    if (P.isOnLineSegment(new LineSegment(this.tail, head))) return P;
  }

  /**
   * Subdivides the HalfEdge into smaller Edges, using a threshold.
   * @param threshold The value determining the maximum length of a subdivision of the original {@link HalfEdge}.
   */
  subdivideToThreshold(threshold: number): void {
    const initialHalfEdge: HalfEdge = this;
    let currentHalfEdge: HalfEdge = initialHalfEdge;

    while (currentHalfEdge != initialHalfEdge.next) {
      const length = currentHalfEdge.getLength();
      if (currentHalfEdge.next && typeof length === "number" && length < threshold) {
        currentHalfEdge = currentHalfEdge.next;
      } else {
        const newHalfEdge = currentHalfEdge.subdivide();
        currentHalfEdge = newHalfEdge ?? currentHalfEdge.next ?? initialHalfEdge;
      }
    }
  }

  /**
   * Gets the associated angle of the HalfEdge, which are the defined as the
   * sector bounds of the sector enclosing the HalfEdge.
   * @returns An Array of angles in radians. It has length one if the {@link HalfEdge} is aligned.
   */
  getAssociatedAngles(): number[] {
    const angle = this.getAngle();
    if (typeof angle !== "number") return [];
    const sectors = this.dcel.config.c.getSectors();
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

  /**
   * Gets the angle of the HalfEdge's assigned direction.
   * @returns The angle in radians.
   */
  getAssignedAngle(): number | undefined {
    if (typeof this.assignedDirection !== "number") return;
    const sectors = this.dcel.config.c.getSectors();
    return Math.PI * 2 * (this.assignedDirection / sectors.length);
  }

  /**
   * Gets the sector(s) the HalfEdge is enclosed by.
   * @returns An array of Sectors. It has length 2 if the {@link HalfEdge} is aligned.
   */
  getAssociatedSector(): Sector[] {
    const associatedAngles = this.getAssociatedAngles();
    const sectors = this.dcel.config.c.getSectors();
    const direction = associatedAngles;

    return sectors.reduce((acc: Sector[], sector) => {
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
   * Needed for constructing the staircase of an unaligned deviating edge.
   * @returns The closest associated angle of an edge in respect to its assigned angle.
   */

  // TODO: Where does such function live?
  // within the HalfEdge class or rather within Staircase??
  getClosestAssociatedAngle(): number | undefined {
    const associatedSector = this.getAssociatedSector();
    if (this.class !== OrientationClasses.UD || !associatedSector) return; // TODO: error handling, this function is only meant to be used for unaligned deviating edges
    const sector = associatedSector[0];

    // TODO: refactor: find better solution for last sector and it's upper bound
    // set upperbound of last to Math.PI * 2 ?
    const upper = sector.idx === this.dcel.config.c.getSectors().length - 1 ? 0 : sector.upper;
    const lower = sector.lower;
    const angle = this.getAssignedAngle() === 0 ? Math.PI * 2 : this.getAssignedAngle();

    return upper + this.dcel.config.c.getSectorAngle() === angle ? upper : lower;
  }

  /**
   * Determines whether the HalfEdge's assigned Direction is adjacent to its associated sector.
   * @returns A boolean, indicating whether or not the {@link HalfEdge} is deviating.
   */
  isDeviating(): boolean {
    let assignedAngle = this.getAssignedAngle();
    if (typeof assignedAngle !== "number") return false;
    if (this.isAligned()) {
      return this.getAssociatedAngles()[0] !== this.getAssignedAngle();
    } else {
      const sector = this.getAssociatedSector()[0];
      //TODO: refactor find better solution for last sector (idx=0)
      if (sector.idx === this.dcel.config.c.getSectors().length - 1 && assignedAngle === 0)
        assignedAngle = Math.PI * 2;
      return !sector.encloses(assignedAngle);
    }
  }

  getDeviation(sector: Sector): number | undefined {
    const angle = this.getAngle();
    if (typeof angle !== "number") return;
    const diff = Math.abs(angle - sector.lower);
    return diff > Math.PI ? Math.abs(diff - Math.PI * 2) : diff;
  }

  /**
   * Determines whether the HalfEdge is aligned to one of the orientations of C.
   * @returns A boolean, indicating whether or not the {@link HalfEdge} is aligned.
   */
  isAligned(): boolean {
    const isAligned = this.getAssociatedAngles().length === 1;
    return (this.isAligning = isAligned);
  }

  distanceToEdge(otherEdge: HalfEdge): number | undefined {
    const head = this.getHead();
    const otherHead = otherEdge.getHead();
    if (!head || !otherHead) return;
    const verticesThis = [this.tail, head];
    const verticesEdge = [otherEdge.tail, otherHead];
    const distances = [
      ...verticesThis.map((v) => v.distanceToEdge(otherEdge)),
      ...verticesEdge.map((v) => v.distanceToEdge(this)),
    ].filter((distance): distance is number => !!distance);
    return Math.min(...distances);
  }

  toLineSegment(): LineSegment | undefined {
    const head = this.getHead();
    if (head) return new LineSegment(this.tail, head);
  }

  classify(): void {
    this.tail.assignDirections();

    if (this.class) return; // do not overwrite classification
    const head = this.getHead();

    if (head && head.significant) return; // do not classify a HalfEdge which has a significant head

    const associatedSector = this.getAssociatedSector();
    const sector = associatedSector[0];
    const significantVertex = this.getSignificantVertex() || this.tail;
    const edges = significantVertex
      .getEdgesInSector(sector)
      .filter((edge) => !edge.isAligned() && !edge.isDeviating());

    let classification: OrientationClasses;
    if (this.isAligned()) {
      classification = this.isDeviating() ? OrientationClasses.AD : OrientationClasses.AB;
    } else if (this.isDeviating()) {
      classification = OrientationClasses.UD;
    } else if (edges.length == 2) {
      classification = OrientationClasses.E;
    } else {
      classification = OrientationClasses.UB;
    }

    this.class = classification;
    if (this.twin) this.twin.class = classification;
  }

  getStepLengths(se: number, d1: number): number[] {
    //TODO: move getStepLenghts() to staircase ??
    const associatedAngles = this.getAssociatedAngles();
    if (!associatedAngles) return [];
    const d2 = associatedAngles.find((angle) => angle !== d1);
    if (typeof d2 !== "number") return [];
    const d1u = getUnitVector(d1);
    const d2u = getUnitVector(d2);

    // create vector of edge
    const v = this.getVector();
    if (!v) return [];
    const vse = v.times(1 / se);

    // solve linear equation for l1 and l2 with cramer's rule for 2x2 systems
    const det = d1u.dx * d2u.dy - d1u.dy * d2u.dx;
    const detX = vse.dx * d2u.dy - vse.dy * d2u.dx;
    const l1 = detX / det;
    const detY = d1u.dx * vse.dy - d1u.dy * vse.dx;
    const l2 = detY / det;

    return [l1, l2];
  }

  /**
   * Gets the modified tail Vertex, which is used for calculating the edgeDistance between HalfEdges sharing one Vertex.
   * @param offsetEdge The edge of which a part should be ignored.
   * @param offset The distance the offset Vertex should be moved in respect to its (original) tail Vertex.
   * @returns The Vertex on the edge of which a part should be ignored and from where the edge is considered for calculating the edgeDistance.
   */
  getOffsetVertex(offsetEdge: HalfEdge, offset: number): Vertex | undefined {
    const angle = offsetEdge.getAngle();
    if (typeof angle !== "number") return;
    const pointOffset = offsetEdge.tail.getNewPoint(offset, angle);
    return new Vertex(pointOffset.x, pointOffset.y, offsetEdge.dcel);
  }

  /**
   * Determines the type of the HalfEdge depending on the convexity or reflexivity of its endpoints.
   * @returns A enum, indicating the inflection Type of the {@link HalfEdge}.
   */
  getInflectionType(): InflectionType | undefined {
    const head = this.getHead();
    if (!head || !this.face) return;
    const tailAngle = this.tail.getExteriorAngle(this.face);
    const headAngle = head.getExteriorAngle(this.face);
    if (!tailAngle || !headAngle) return;

    if (tailAngle > 0 && headAngle > 0) return InflectionType.C;
    else if (tailAngle < 0 && headAngle < 0) return InflectionType.R;
    else return InflectionType.B;
  }

  /**
   * Converts the halfedge into a short string. For debbuging purposes.
   * @returns A string representing the {@link Halfedge}'s endpoints.
   */
  toString() {
    return this.getEndpoints()
      .map((p) => p.xy().join("/"))
      .join("->");
  }
}

export default HalfEdge;
