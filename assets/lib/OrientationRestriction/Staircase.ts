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
    const edgeClass = edge.class;
    if (edgeClass === EdgeClasses.AB) {
      return [
        new Point(edge.getTail().x, edge.getTail().y),
        new Point(edge.getHead().x, edge.getHead().y),
      ]; // QUESTION: better 4 coordinates to span an area?
    } else if (edgeClass === EdgeClasses.UB || edgeClass === EdgeClasses.E) {
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
    } else if (edgeClass === EdgeClasses.UD) {
      // TODO: like UB and E but accommodate for the appendex area
      return;
    } else if (edgeClass === EdgeClasses.AD) {
      this.points = this.getStaircasePoints();
      const convexHull = new ConvexHullGrahamScan();
      this.points.forEach((p) => convexHull.addPoint(p.x, p.y));
      return convexHull.getHull().map((p) => new Point(p.x, p.y));
    }
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
      case EdgeClasses.AB:
        return; // TODO: implement other cases
    }
  }

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

  getStairCasePointsUB(se: number = 2): Point[] {
    const edge = this.edge;

    const d1 = edge.getAssignedAngle();
    const d2 = edge.getAssociatedAngles().find((angle) => angle !== d1);
    const [l1, l2] = edge.getStepLengths(se);

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

  getStairCasePointsE(se: number = 4): Point[] {
    const edge = this.edge;

    const d1 = edge.getAssignedAngle();
    const d2 = edge.getAssociatedAngles().find((angle) => angle !== d1);
    const [l1, l2] = edge.getStepLengths(se);

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
}

export default Staircase;
