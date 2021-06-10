import { EDGE_CLASSES } from "./dcel/HalfEdge.mjs";
import Point from "./Point.mjs";
import Line from "./Line.mjs";

class Staircase {
  constructor(halfEdge) {
    this.halfEdge = halfEdge;
    this.region = this.getRegion(halfEdge);
    this.de = null; // TODO: move this to HalfEdge? not really related to halfEdge
    this.stepNumbers = null;
    this.geometry = null; // contains edges and vertices constructing the staircase
  }

  getRegion() {
    const edge = this.halfEdge;
    const edgeClass = edge.class;
    if (edgeClass === EDGE_CLASSES.AB) {
      return [
        [edge.getTail().x, edge.getTail().y],
        [edge.getHead().x, edge.geHead().y],
      ];
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
      // TODO: like ub and e but accommodate for the appendex area
      return;
    } else if (edgeClass === EDGE_CLASSES.AD) {
      // TODO: implement bounding box
      const _deltaE = edge.getLength() * 0.1;
      return;
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

  buildStaircase() {
    const edge = this.halfEdge;
    const edgeClass = edge.class;
    if (edgeClass === EDGE_CLASSES.AD) {
      const epsilon = 0.1;
      d1 = edge.class;
      d2 = edge.getAngle();
    }

    this.geometry = staircase;
    return staircase;
  }
}

export default Staircase;
