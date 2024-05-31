import { v4 as uuid } from "uuid";
import Configuration from "../c-oriented-schematization/Configuration";
import Sector from "../c-oriented-schematization/Sector";
import Line from "../geometry/Line";
import LineSegment from "../geometry/LineSegment";
import Point from "../geometry/Point";
import Vector2D from "../geometry/Vector2D";
import { getUnitVector } from "../utilities";
import Dcel from "./Dcel";
import Face from "./Face";
import Vertex from "./Vertex";
import C from "../c-oriented-schematization/C";

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

  constructor(tail: Vertex, dcel: Dcel) {
    this.uuid = uuid();
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
    return `${tail.getUuid(10)}/${head.getUuid(10)}`;
  }

  /**
   * Get the unique identifier of the HalfEdge.
   * @param stop defines how many strings of the uuid are returned
   * @returns the edge's uuid
   */
  getUuid(length?: number) {
    return this.uuid.substring(0, length);
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
   */
  move(newTail: Point, newHead: Point) {
    const head = this.head;
    const prevTail = this.prev?.tail;
    const nextHead = this.next?.head;
    if (!head || !nextHead || !prevTail) return;
    if (newHead.equals(nextHead)) {
      const newEdge = head.remove(this.face);
      if (newEdge) newEdge.configuration = new Configuration(newEdge);
      newEdge?.dcel.faceFaceBoundaryList?.addEdge(newEdge);
    } else head.moveTo(newHead.x, newHead.y);
    if (newTail.equals(prevTail)) {
      const newEdge = this.tail.remove(this.face);
      if (newEdge) newEdge.configuration = new Configuration(newEdge);
      newEdge?.dcel.faceFaceBoundaryList?.addEdge(newEdge);
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
   * Gets the associated angle of the HalfEdge, which are the defined as the
   * sector bounds of the sector enclosing the HalfEdge.
   * @returns An Array of angles in radians. It has length one if the {@link HalfEdge} is aligned.
   */
  getAssociatedAngles(sectors: Sector[]) {
    const angle = this.getAngle();
    if (typeof angle !== "number") return [];
    const directions: number[] = [];
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
  getAssignedAngle(sectors: Sector[]) {
    if (typeof this.assignedDirection !== "number") return;
    return Math.PI * 2 * (this.assignedDirection / sectors.length);
  }

  /**
   * Gets the sector(s) the HalfEdge is enclosed by.
   * @returns An array of Sectors. It has length 2 if the {@link HalfEdge} is aligned.
   */
  getAssociatedSector(sectors: Sector[]) {
    const associatedAngles = this.getAssociatedAngles(sectors);
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
   * @returns The closest associated angle of an {@link HalfEdge} in respect to its assigned angle.
   */

  // TODO: Where does such function live?
  // within the HalfEdge class or rather within Staircase??
  getClosestAssociatedAngle(c: C) {
    const sectors = c.sectors;
    const associatedSector = this.getAssociatedSector(sectors);
    if (this.class !== OrientationClasses.UD || !associatedSector) return; // TODO: error handling, this function is only meant to be used for unaligned deviating edges
    const sector = associatedSector[0];

    // TODO: refactor: find better solution for last sector and it's upper bound
    // set upperbound of last to Math.PI * 2 ?
    const upper = sector.idx === sectors.length - 1 ? 0 : sector.upper;
    const lower = sector.lower;
    const angle =
      this.getAssignedAngle(sectors) === 0
        ? Math.PI * 2
        : this.getAssignedAngle(sectors);

    return upper + c.sectorAngle === angle ? upper : lower;
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
   * Get the lengths of the staircase steps.
   * @param se The step size of the staircase.
   * @param d1 The direction of the first step.
   * @param sectors The sectors the HalfEdge is enclosed by.
   * @returns An array of numbers, indicating the lengths of the steps.
   */
  getStepLengths(se: number, d1: number, sectors: Sector[]) {
    //TODO: move getStepLengths() to staircase ??
    const associatedAngles = this.getAssociatedAngles(sectors);
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
   * Gets the modified tail {@link Vertex}, which is used for calculating the edgeDistance between HalfEdges sharing one Vertex.
   * @param offsetEdge The {@link HalfEdge} of which a part should be ignored.
   * @param offset The distance the offset Vertex should be moved in respect to its (original) tail {@link Vertex}.
   * @returns The Vertex on the edge of which a part should be ignored and from where the edge is considered for calculating the edgeDistance.
   */
  getOffsetVertex(offsetEdge: HalfEdge, offset: number) {
    const angle = offsetEdge.getAngle();
    if (typeof angle !== "number") return;
    const pointOffset = offsetEdge.tail.getNewPoint(offset, angle);
    return new Vertex(pointOffset.x, pointOffset.y, offsetEdge.dcel);
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
