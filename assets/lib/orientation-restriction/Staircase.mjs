import { EDGE_CLASSES } from "../dcel/HalfEdge.mjs";
import Point from "../Point.mjs";
import Line from "../Line.mjs";
import ConvexHullGrahamScan from "graham_scan";

class Staircase {
  constructor(edge) {
    this.edge = edge;
    this.region = this.getRegion();
    this.de; // TODO: move this to HalfEdge? not really related to edge
    this.stepNumbers;
    this.points;
  }

  getRegion() {
    const edge = this.edge;
    const edgeClass = edge.class;
    if (edgeClass === EDGE_CLASSES.AB) {
      return [edge.getTail().xy(), edge.getHead().xy()]; // QUESTION: better 4 coordinates to span an area?
    } else if (edgeClass === EDGE_CLASSES.UB || edgeClass === EDGE_CLASSES.E) {
      const [lower, upper] = edge.getAssociatedSector()[0].getBounds();
      const A = new Point(...edge.getTail().xy());
      const a = new Line(A, lower);
      const d = new Line(A, upper);
      const C = new Point(...edge.getHead().xy());
      const b = new Line(C, upper);
      const c = new Line(C, lower);
      const B = a.intersectsLine(b);
      const D = d.intersectsLine(c);
      return [A, B, C, D];
    } else if (edgeClass === EDGE_CLASSES.UD) {
      // TODO: like UB and E but accommodate for the appendex area
      return;
    } else if (edgeClass === EDGE_CLASSES.AD) {
      this.points = this.getStaircasePoints(this.edge);
      const convexHull = new ConvexHullGrahamScan();
      this.points.forEach((p) => convexHull.addPoint(p.x, p.y));
      return convexHull.getHull();
    }
  }

  getEdgeDistance() {
    if (this.class === EDGE_CLASSES.AB) {
      return;
    }
    // TODO: implement other cases
  }

  getStepNumbers() {
    const staircaseRegion = this.getStaircaseRegion();

    let stepNumbers;
    return stepNumbers;
  }

  getStaircasePoints(edge) {
    switch (edge.class) {
      case EDGE_CLASSES.AD:
        return this.getStairCasePointsAD(edge);
      case EDGE_CLASSES.A:
        return; // TODO: implement other cases
    }
  }

  getStairCasePointsAD(edge) {
    const epsilon = 0.1;
    const deltaE = edge.getLength() * epsilon;
    const d1 = this.edge.dcel.config.C.getAngles()[edge.assignedAngle];
    const d2 = edge.getAngle();
    const d1Opposite = (d1 + Math.PI) % (Math.PI * 2);

    const points = [];

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
}

export default Staircase;
