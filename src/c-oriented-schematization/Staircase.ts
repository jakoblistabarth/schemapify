import ConvexHullGrahamScan from "graham_scan";
import Dcel from "../Dcel/Dcel";
import HalfEdge from "../Dcel/HalfEdge";
import Vertex from "../Dcel/Vertex";
import Line from "../geometry/Line";
import Point from "../geometry/Point";
import Polygon from "../geometry/Polygon";
import Ring from "../geometry/Ring";
import Sector from "./Sector";
import { CStyle } from "./schematization.style";
import { Orientation, getAssignedAngle } from "./HalfEdgeClassGenerator";
import { getAssociatedAngles, getAssociatedSector } from "./HalfEdgeUtils";
import { getUnitVector } from "../utilities";
import C from "./C";

class Staircase {
  /** The {@link HalfEdge} the staircase belongs to. */
  edge: HalfEdge;
  /** The orientation class of the {@link HalfEdge} */
  orientation: Orientation;
  /** The assigned direction of the {@link HalfEdge} */
  assignedDirection: number;
  /** the significant {@link Vertex} */
  significantVertex?: Vertex;
  /** A {@link Polygon} encompassing the staircase. */
  region: Polygon;
  /** Upper bound on the maximal distance between the staircase of e and e itself. */
  deltaE?: number;
  /** An array of {@link Point}s describing the staircase. */
  points: Point[];
  /** The minimal distance from e to another point in subdivision S. */
  _de?: number;
  /** The number of steps the staircase the must use.  */
  se?: number;
  /** A list of {@link HalfEdge}s whose staircase regions interfer with this staircase region.  */
  interferesWith: HalfEdge[];
  #cStyle: CStyle;

  constructor(
    edge: HalfEdge,
    orientation: Orientation,
    assignedDirection: number,
    significantVertex: Vertex | undefined,
    cStyle: CStyle,
  ) {
    this.edge = edge;
    this.orientation = orientation;
    this.assignedDirection = assignedDirection;
    this.significantVertex = significantVertex;
    this.#cStyle = cStyle;
    this.deltaE = this.getDeltaE();
    this.points = [];
    this.region = this.getRegion();
    this.interferesWith = [];
  }

  // TODO: fix typing, infere type if possible
  get de(): number | undefined {
    return this._de;
  }

  /**
   * Sets de of the Staircase, if it is smaller than a possibly already calculated distance.
   * @param edgeDistance Minimum distance to another point in the subdivision S.
   */
  set de(edgeDistance: number) {
    if (!this.de || edgeDistance < this.de) this._de = edgeDistance;
  }

  /**
   * Set se, defined as "the number of steps a {@link Staircase} must use"
   * The number of steps is per staircase is determined by the distance to the next edge:
   * "By increasing the number of steps in the staircase, intersections can be avoided."
   */
  setSe(sectors: Sector[]) {
    const edge = this.edge;
    const length = edge.getLength();
    const angle = edge.getAngle();
    switch (this.orientation) {
      // "Aligned deviating edges do not use steps but a value δe instead. (p.17)"
      // TODO: make this function pure by not setting deltaE from within
      case Orientation.AD: {
        if (typeof this.de !== "number" || typeof this.deltaE !== "number")
          return;
        // "… we use δe = min{de/2,Δe}, where Δe = 0.1||e|| as defined for the staircase regions."
        if (this.de / 2 < this.deltaE) this.deltaE = this.de / 2;
        break;
      }
      case Orientation.UD: {
        if (typeof this.de !== "number" || typeof length !== "number") return;
        const maxVertices = this.getStaircasePoints() // TODO: use points property instead
          .slice(1, 2)
          .map((point) => new Vertex(point.x, point.y, new Dcel()));
        const distances = maxVertices.map((vertex) => {
          const distance = vertex.distanceToEdge(edge);
          return distance ? distance : Infinity; // QUESTION: is it ok to return infinity here?
        });
        const d1 = Math.min(...distances);
        let se = Math.ceil((2 * d1 * length) / this.de + 1);
        se = se % 2 === 0 ? se + 2 : se + 1; // TODO: check if this is correct? (p. 18)
        this.se = Math.max(4, se);
        break;
      }
      default: {
        if (
          typeof this.de !== "number" ||
          typeof angle !== "number" ||
          typeof length !== "number"
        )
          return;
        // "Let 𝛼1 denote the absolute angle between vector w−v and the assigned direction of e.
        // Similarly, 𝛼2 denotes the absolute angle between vector w−v and the other associated direction of e."
        const alpha1 = angle - getAssociatedAngles(edge, sectors)[0];
        const alpha2 = getAssociatedAngles(edge, sectors)[1] - angle;
        const maximum_step_length =
          ((Math.pow(Math.tan(alpha1), -1) + Math.pow(Math.tan(alpha2), -1)) *
            this.de) /
          2;
        const se = Math.ceil(length / maximum_step_length);
        this.se = se % 2 === 0 ? se + 2 : se + 1; // TODO: check if this is correct? (p. 18)
      }
    }
  }

  getDeltaE() {
    const length = this.edge.getLength();
    return typeof length === "number" && this.orientation === Orientation.AD
      ? length * 0.1
      : undefined;
  }

  /**
   * Gets the staircase region of an edge, depending on its class.
   * If the edge has an significant Vertex, it has to be the tail of the edge.
   * If that's not the case its twin is used for calculating the staircase region.
   * @returns A {@link Polygon} representing the region of an edge.
   */
  getRegion() {
    const edge =
      !this.significantVertex || this.significantVertex === this.edge.tail
        ? this.edge
        : this.edge.twin;
    const head = edge?.head;
    const sectors = this.#cStyle.c.sectors;
    const assignedAngle = getAssignedAngle(this.assignedDirection, sectors);
    if (!edge || !head || typeof assignedAngle !== "number")
      return new Polygon([]);

    switch (this.orientation) {
      case Orientation.AB:
        return Polygon.fromCoordinates([
          [
            [edge.tail.x, edge.tail.y],
            [head.x, head.y],
            [head.x, head.y],
            [edge.tail.x, edge.tail.y],
          ],
        ]);
      case Orientation.UB:
        return this.getSimpleRegion();
      case Orientation.E:
        return this.getSimpleRegion();
      case Orientation.UD:
        // like UB and E but accommodate for the appended area
        // "that is used to make the staircase adhere to the assigned direction (see Figure 12(b–c))."
        this.points = this.getStaircasePoints();

        const [lower, upper] = getAssociatedSector(
          edge,
          sectors,
        )[0].getBounds();
        if (typeof lower !== "number" || typeof upper !== "number")
          return new Polygon([]);
        const smallestAssociatedAngle = getClosestAssociatedAngle(
          edge,
          this.#cStyle.c,
          this.orientation,
          this.assignedDirection,
        );
        const largestAssociatedAngle = getAssociatedAngles(edge, sectors).find(
          (angle) => angle != smallestAssociatedAngle,
        );
        if (
          typeof smallestAssociatedAngle !== "number" ||
          typeof largestAssociatedAngle !== "number"
        )
          return new Polygon([]);
        const V = new Point(edge.tail.x, edge.tail.y);
        const a = new Line(V, assignedAngle); // QUESTION: not mentioned in the paper!
        const e = new Line(V, largestAssociatedAngle);
        const W = new Point(head.x, head.y);
        const cAngle = largestAssociatedAngle === upper ? upper : lower; // QUESTION: is there a way to do this more elegantly, without specifying c and d explicitly?
        const dAngle = cAngle === upper ? lower : upper;
        const c = new Line(W, cAngle);
        const d = new Line(W, dAngle);
        const P = this.points[2];
        const b = new Line(P, smallestAssociatedAngle);
        const C = b.intersectsLine(c);
        const B = a.intersectsLine(b);
        const D = e.intersectsLine(d);
        if (!B || !C || !D) return new Polygon([]);
        const regionPoints = [V, B, C, W, D];

        // We assumed that p lies in the defined region.
        // However, if this is not the case, we can extend the staircase region
        // by including the vertices of the appended region;
        if (!P.isInPolygon(new Polygon([new Ring(regionPoints)]))) {
          regionPoints.splice(2, 0, P);
        }

        return new Polygon([new Ring(regionPoints)]);
      case Orientation.AD:
        this.points = this.getStaircasePoints();
        const convexHull = new ConvexHullGrahamScan();
        this.points.forEach((p) => convexHull.addPoint(p.x, p.y));
        return new Polygon([
          new Ring(convexHull.getHull().map((p) => new Point(p.x, p.y))),
        ]);
      default:
        return new Polygon([]);
    }
  }

  /**
   * Calculates the area of a step, which is a triangle.
   * The area of each step of an edge is either added to or subtracted from its incident faces.
   * @param assignedEdge The length of the assigned step edge.
   * @param associatedEdge The length of the associated step edge.
   * @returns The area of a step.
   */
  getStepArea(assignedEdge: number, associatedEdge: number) {
    const enclosingAngle = (Math.PI * 2) / this.#cStyle.c.directions.length;
    return (assignedEdge * associatedEdge * Math.sin(enclosingAngle)) / 2;
  }

  /**
   * Returns the points of the staircase.
   * @returns All {@link Point}s constructing the {@link Staircase}.
   */
  getStaircasePoints() {
    switch (this.orientation) {
      case Orientation.UB:
        return this.getStaircasePointsUB();
      case Orientation.E:
        return this.getStaircasePointsE();
      case Orientation.AD:
        return this.getStaircasePointsAD();
      case Orientation.UD:
        return this.getStaircasePointsUD();
      default:
        return [];
    }
  }

  /**
   * Returns a staircase for an "aligned deviating" edge.
   * @returns All {@link Point}s constructing the {@link Staircase} (including tail and head of the original edge).
   */
  getStaircasePointsAD() {
    const edge = this.edge;
    if (!this.deltaE) return [];
    const epsilon = this.#cStyle.staircaseEpsilon;
    const d1 = getAssignedAngle(this.assignedDirection, this.#cStyle.c.sectors);
    if (typeof d1 !== "number") return [];
    const d2 = edge.getAngle();
    if (typeof d2 !== "number") return [];
    const d1Opposite = (d1 + Math.PI) % (Math.PI * 2);

    const points: Point[] = [];
    const tail = edge.tail;
    const head = edge.head;
    const length = edge.getLength();
    if (typeof length !== "number" || !head) return [];

    points[0] = tail;
    points[1] = tail.getNewPoint(this.deltaE, d1);
    points[2] = points[1].getNewPoint((length * (1 - epsilon)) / 2, d2);
    points[3] = points[2].getNewPoint(this.deltaE * 2, d1Opposite);
    points[4] = points[3].getNewPoint((length * (1 - epsilon)) / 2, d2);
    points[5] = points[4].getNewPoint(this.deltaE, d1);
    points[6] = head;

    return points;
  }

  /**
   * Gets the Points of the staircase region for unaligned basic and evading edges.
   * The region is the area bounded by lines oriented according to the associated directions (both at v and w).
   * @returns a {@link Polygon} representing the Staircase region.
   */
  getSimpleRegion() {
    const edge = this.edge;
    const head = edge.head;
    if (!head) return new Polygon([]);

    const associatedSector = getAssociatedSector(edge, this.#cStyle.c.sectors);
    if (!associatedSector) return new Polygon([]);
    const [lower, upper] = associatedSector[0].getBounds();
    const A = new Point(edge.tail.x, edge.tail.y);
    const a = new Line(A, lower);
    const d = new Line(A, upper);
    const C = new Point(head.x, head.y);
    const b = new Line(C, upper);
    const c = new Line(C, lower);
    const B = a.intersectsLine(b);
    const D = d.intersectsLine(c);
    return B && D ? new Polygon([new Ring([A, B, C, D])]) : new Polygon([]);
  }

  /**
   * Returns a staircase for an "unaligned basic" edge.
   * @param se number of steps used to construct the staircase, the minimum number of steps is, the functions default value: 2
   * @returns all points constructing the staircase (including tail and head of the original edge)
   */
  getStaircasePointsUB() {
    const se = this.se || 2;
    const edge = this.edge;

    const sectors = this.#cStyle.c.sectors;
    const d1 = getAssignedAngle(this.assignedDirection, sectors);
    const associatedAngles = getAssociatedAngles(edge, sectors);
    if (typeof d1 !== "number" || !associatedAngles) return [];
    const d2 = associatedAngles.find((angle) => angle !== d1);
    if (typeof d2 !== "number") return [];
    const [l1, l2] = getStepLengths(edge, se, d1, sectors);

    const points: Point[] = [edge.tail];
    for (let idx = 0; idx < se; idx++) {
      const o = points[idx * 2];
      if (idx % 2 === 0) {
        const p1 = o.getNewPoint(l1, d1);
        const p2 = p1.getNewPoint(l2, d2);
        points.push(p1, p2);
      } else {
        const p1 = o.getNewPoint(l2, d2);
        const p2 = p1.getNewPoint(l1, d1);
        points.push(p1, p2);
      }
    }

    return points;
  }

  /**
   * Returns a staircase for an "evading" edge.
   * @param se number of steps used to construct the staircase, the minimum number of steps is, the functions default value: 4
   * @returns all points constructing the staircase (including tail and head of the original edge)
   */
  getStaircasePointsE() {
    const se = this.se || 4;
    const edge = this.edge;

    const sectors = this.#cStyle.c.sectors;
    const d1 = getAssignedAngle(this.assignedDirection, sectors);
    const associatedAngles = getAssociatedAngles(edge, sectors);
    if (typeof d1 !== "number" || !associatedAngles) return [];
    const d2 = associatedAngles.find((angle) => angle !== d1);
    if (typeof d2 !== "number") return [];
    const [l1, l2] = getStepLengths(edge, se, d1, sectors);

    const points: Point[] = [edge.tail];
    for (let idx = 0; idx < se; idx++) {
      const o = points[idx * 2];
      if (idx < se / 2) {
        const p1 = o.getNewPoint(l1, d1);
        const p2 = p1.getNewPoint(l2, d2);
        points.push(p1, p2);
      } else {
        const p1 = o.getNewPoint(l2, d2);
        const p2 = p1.getNewPoint(l1, d1);
        points.push(p1, p2);
      }
    }

    return points;
  }

  /**
   * Get the 2 points that are appended to the staircase region of an "unaligned deviating" edge.
   * @param originalStaircasePoints Points of the original staircase
   * @param l1 length of an assigned step
   * @param l2 length of an associated step
   * @param d1 angle of the assigned step
   * @returns The 2 points appended to the staircase region.
   */
  getAppendedAreaPoints(
    originalStaircasePoints: Point[],
    l1: number,
    l2: number,
    d1: number,
  ) {
    const stepArea = this.getStepArea(l1, l2);
    const sectors = this.#cStyle.c.sectors;
    const assignedAngle = getAssignedAngle(this.assignedDirection, sectors);
    if (typeof stepArea !== "number" || typeof assignedAngle !== "number")
      return [];
    const height = (stepArea * 2) / l2; // get the height of a parallelogram, using A/b = h
    const a = stepArea / height;

    const p1 = originalStaircasePoints[0].getNewPoint(a, assignedAngle);
    const p2 = p1.getNewPoint(l1, d1);

    return [p1, p2];
  }

  /**
   * Returns a staircase for an "unaligned deviating" edge.
   * @param se number of steps used to construct the staircase, the minimum number of steps is, the functions default value: 4
   * @returns all points constructing the staircase (including tail and head of the original edge)
   */
  getStaircasePointsUD() {
    const se = this.se || 4;
    const edge = this.edge;

    const sectors = this.#cStyle.c.sectors;
    const d1 = getClosestAssociatedAngle(
      edge,
      this.#cStyle.c,
      this.orientation,
      this.assignedDirection,
    );
    const associatedAngles = getAssociatedAngles(edge, sectors);
    if (typeof d1 !== "number" || !associatedAngles) return [];
    const d2 = associatedAngles.find((angle) => angle !== d1);
    if (typeof d2 !== "number") return [];
    const [l1, l2] = getStepLengths(edge, se - 1, d1, sectors);

    // like for an evading edge, but 1 associated step less
    const points: Point[] = [edge.tail];
    for (let idx = 0; idx < se - 1; idx++) {
      const o = points[idx * 2];
      if (idx < se / 2 - 1) {
        const p1 = o.getNewPoint(l1, d1);
        const p2 = p1.getNewPoint(l2, d2);
        points.push(p1, p2);
      } else {
        const p1 = o.getNewPoint(l2, d2);
        const p2 = p1.getNewPoint(l1, d1);
        points.push(p1, p2);
      }
    }

    const [p1, p2] = this.getAppendedAreaPoints(points, l1, l2, d1);
    points.splice(1, 0, p1, p2);

    return points;
  }
}

export default Staircase;

/**
 * Get the lengths of the staircase steps.
 * @param se The step size of the staircase.
 * @param d1 The direction of the first step.
 * @param sectors The sectors the HalfEdge is enclosed by.
 * @returns An array of numbers, indicating the lengths of the steps.
 */
export const getStepLengths = (
  halfEdge: HalfEdge,
  se: number,
  d1: number,
  sectors: Sector[],
) => {
  const associatedAngles = getAssociatedAngles(halfEdge, sectors);
  if (!associatedAngles) return [];
  const d2 = associatedAngles.find((angle) => angle !== d1);
  if (typeof d2 !== "number") return [];
  const d1u = getUnitVector(d1);
  const d2u = getUnitVector(d2);

  // create vector of edge
  const v = halfEdge.getVector();
  if (!v) return [];
  const vse = v.times(1 / se);

  // solve linear equation for l1 and l2 with cramer's rule for 2x2 systems
  const det = d1u.dx * d2u.dy - d1u.dy * d2u.dx;
  const detX = vse.dx * d2u.dy - vse.dy * d2u.dx;
  const l1 = detX / det;
  const detY = d1u.dx * vse.dy - d1u.dy * vse.dx;
  const l2 = detY / det;

  return [l1, l2];
};

/**
 * Gets the closest associated angle (one bound of its associated sector)
 * of an unaligned deviating(!) edge in respect to its assigned angle.
 * Needed for constructing the {@link Staircase} of an unaligned deviating edge.
 * @param halfEdge The {@link HalfEdge} of which to get the closest associated angle.
 * @param c The set of orientations used for determining the associated angle.
 * @param orientation The orientation of the {@link HalfEdge}.
 * @param assignedDirection The assigned direction of the {@link HalfeEge}.
 * @returns The closest associated angle of an {@link HalfEdge} in respect to its assigned angle.
 */
export const getClosestAssociatedAngle = (
  halfEdge: HalfEdge,
  c: C,
  orientation: Orientation,
  assignedDirection: number,
) => {
  const sectors = c.sectors;
  const associatedSector = getAssociatedSector(halfEdge, sectors);
  if (orientation !== Orientation.UD || !associatedSector) return; // TODO: error handling, this function is only meant to be used for unaligned deviating edges
  const sector = associatedSector[0];

  // TODO: refactor: find better solution for last sector and it's upper bound
  // set upperbound of last to Math.PI * 2 ?
  const upper = sector.idx === sectors.length - 1 ? 0 : sector.upper;
  const lower = sector.lower;
  const angle =
    getAssignedAngle(assignedDirection, sectors) === 0
      ? Math.PI * 2
      : getAssignedAngle(assignedDirection, sectors);

  return upper + c.sectorAngle === angle ? upper : lower;
};
