import HalfEdge from "../DCEL/HalfEdge";
import Line from "../geometry/Line";

export const enum OuterEdge {
  PREV = "prev",
  NEXT = "next",
}

class Configuration {
  innerEdge: HalfEdge;
  positiveBlockingNumber: number;
  negativeBlockingNumber: number;

  constructor(edge: HalfEdge) {
    this.innerEdge = edge; // TODO: not very elegant, similar problem to saving the dcel explicitly to Vertices and HalfEdges.
    this.positiveBlockingNumber = undefined;
    this.negativeBlockingNumber = undefined;
  }

  getOuterEdge(position: OuterEdge): HalfEdge {
    return position === OuterEdge.PREV ? this.innerEdge.prev : this.innerEdge.next;
  }

  getTrack(outerEdge: OuterEdge): Line {
    if (outerEdge === OuterEdge.PREV)
      return new Line(this.innerEdge.getTail(), this.getOuterEdge(OuterEdge.PREV).getAngle());
    else return new Line(this.innerEdge.getHead(), this.getOuterEdge(OuterEdge.NEXT).getAngle());
  }

  getTracks(): Line[] {
    return [this.getTrack(OuterEdge.PREV), this.getTrack(OuterEdge.NEXT)];
  }
}

export default Configuration;
