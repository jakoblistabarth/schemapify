import HalfEdge, { EdgeClasses } from "../Dcel/HalfEdge";
import Point from "../Geometry/Point";
import Line from "../Geometry/Line";
import ConvexHullGrahamScan from "graham_scan";
class Staircase {
  edge: HalfEdge;
  region: Array<Point>;
  de: number;
  stepNumbers: number;
  points: Array<Point>;

  constructor(edge: HalfEdge) {
    this.edge = edge;
    this.region = this.getRegion();
    this.de; // TODO: move this to HalfEdge? not really related to edge
    this.stepNumbers;
    this.points;
  }

  getRegion(): Array<Point> {
    const edge = this.edge;
    switch (this.edge.class) {
      case EdgeClasses.AB:
        return [
          new Point(edge.getTail().x, edge.getTail().y),
          new Point(edge.getHead().x, edge.getHead().y),
          new Point(edge.getTail().x, edge.getTail().y),
        ]; // QUESTION: better 4 coordinates to span an area?
      case EdgeClasses.UB:
        return this.getSimpleRegion();
      case EdgeClasses.E:
        return this.getSimpleRegion();
      case EdgeClasses.UD:
        // TODO: like UB and E but accommodate for the appendex area
        return [
          new Point(edge.getTail().x, edge.getTail().y),
          new Point(edge.getHead().x, edge.getHead().y),
          new Point(edge.getTail().x, edge.getTail().y),
        ];
      case EdgeClasses.AD:
        this.points = this.getStaircasePoints();
        const convexHull = new ConvexHullGrahamScan();
        this.points.forEach((p) => convexHull.addPoint(p.x, p.y));
        return convexHull.getHull().map((p) => new Point(p.x, p.y));
    }
  }

  /**
   * Calculates the area of a step, which is a triangle.
   * @param l1 length of the assigned edge
   * @param l2 length of the associated edge
   * @returns the area a step adds to respectively subtracts from its incident faces
   */
  getStepArea(l1: number, l2: number): number {
    const enclosingAngle = (Math.PI * 2) / this.edge.dcel.config.c.getDirections().length;
    return (l1 * l2 * Math.sin(enclosingAngle)) / 2;
  }

  getEdgeDistance() {
    if (this.edge.class === EdgeClasses.AB) {
      return;
    }
    // TODO: implement other cases
  }

  getStepNumbers() {
    const staircaseRegion = this.getRegion();

    let stepNumbers;
    return stepNumbers;
  }

  getStaircasePoints() {
    switch (this.edge.class) {
      case EdgeClasses.UB:
        return this.getStairCasePointsUB();
      case EdgeClasses.E:
        return this.getStairCasePointsE();
      case EdgeClasses.AD:
        return this.getStairCasePointsAD();
      case EdgeClasses.UD:
        return this.getStairCasePointsUD();
    }
  }

  /**
   * Returns a staircase for an "aligned deviating" edge.
   * @returns all points constructing the staircase (including tail and head of the original edge)
   */
  getStairCasePointsAD() {
    const edge = this.edge;
    const epsilon = 0.1;
    const deltaE = edge.getLength() * epsilon;
    const d1 = edge.getAssignedAngle();
    const d2 = edge.getAngle();
    const d1Opposite = (d1 + Math.PI) % (Math.PI * 2);

    const points: Point[] = [];
    const tail = edge.getTail();
    const head = edge.getHead();

    points[0] = tail;
    points[1] = tail.getNewPoint(deltaE, d1);
    points[2] = points[1].getNewPoint((edge.getLength() * (1 - epsilon)) / 2, d2);
    points[3] = points[2].getNewPoint(deltaE * 2, d1Opposite);
    points[4] = points[3].getNewPoint((edge.getLength() * (1 - epsilon)) / 2, d2);
    points[5] = points[4].getNewPoint(deltaE, d1);
    points[6] = head;

    return points;
  }

  getSimpleRegion(): Point[] {
    const edge = this.edge;
    const [lower, upper] = edge.getAssociatedSector()[0].getBounds();
    const A = new Point(edge.getTail().x, edge.getTail().y);
    const a = new Line(A, lower);
    const d = new Line(A, upper);
    const C = new Point(edge.getHead().x, edge.getHead().y);
    const b = new Line(C, upper);
    const c = new Line(C, lower);
    const B = a.intersectsLine(b);
    const D = d.intersectsLine(c);
    return [A, B, C, D];
  }

  /**
   * Returns a staircase for an "unaligned basic" edge.
   * @param se number of steps used to construct the staircase, the minimum number of steps is, the functions default value: 2
   * @returns all points constructing the staircase (including tail and head of the original edge)
   */
  getStairCasePointsUB(se: number = 2): Point[] {
    const edge = this.edge;

    const d1 = edge.getAssignedAngle();
    const d2 = edge.getAssociatedAngles().find((angle) => angle !== d1);
    const [l1, l2] = edge.getStepLengths(se, d1);

    const points: Point[] = [edge.getTail()];
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
  getStairCasePointsE(se: number = 4): Point[] {
    const edge = this.edge;

    const d1 = edge.getAssignedAngle();
    const d2 = edge.getAssociatedAngles().find((angle) => angle !== d1);
    const [l1, l2] = edge.getStepLengths(se, d1);

    const points: Point[] = [edge.getTail()];
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
   *
   * @param originalStaircasePoints Points of the original staircase
   * @param l1 length of an assigned step
   * @param l2 length of an associated step
   * @param d1 angle of the assigned step
   * @returns
   */
  getAppendedAreaPoints(
    originalStaircasePoints: Point[],
    l1: number,
    l2: number,
    d1: number
  ): Point[] {
    const stepArea = this.getStepArea(l1, l2);
    const height = (stepArea * 2) / l2; // get the height of a parallelogram, using A/b = h
    const a = stepArea / height;

    const p1 = originalStaircasePoints[0].getNewPoint(a, this.edge.getAssignedAngle());
    const p2 = p1.getNewPoint(l1, d1);

    return [p1, p2];
  }

  /**
   * Returns a staircase for an "unaligned deviating" edge.
   * @param se number of steps used to construct the staircase, the minimum number of steps is, the functions default value: 4
   * @returns all points constructing the staircase (including tail and head of the original edge)
   */
  getStairCasePointsUD(se: number = 4): Point[] {
    const edge = this.edge;

    const d1 = edge.getClosestAssociatedAngle();
    const d2 = edge.getAssociatedAngles().find((angle) => angle !== d1);
    const [l1, l2] = edge.getStepLengths(se - 1, d1);

    // like for an evading edge, but 1 associated step less
    const points: Point[] = [edge.getTail()];
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
