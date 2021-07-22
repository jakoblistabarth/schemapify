import HalfEdge, { InflectionType } from "../DCEL/HalfEdge";
import Line from "../geometry/Line";
import LineSegment from "../geometry/LineSegment";
import Point from "../geometry/Point";
import Vector2D from "../geometry/Vector2D";

export enum OuterEdge {
  PREV = "prev",
  NEXT = "next",
}

export enum Contraction {
  POS = "positive",
  NEG = "negative",
}

export type ContractionPoints = {
  [Contraction.POS]: Point | undefined;
  [Contraction.NEG]: Point | undefined;
};

class Configuration {
  innerEdge: HalfEdge;
  positiveBlockingNumber: HalfEdge[];
  negativeBlockingNumber: HalfEdge[];

  constructor(edge: HalfEdge) {
    this.innerEdge = edge; // TODO: not very elegant, similar problem to saving the dcel explicitly to Vertices and HalfEdges.
    this.positiveBlockingNumber = [];
    this.negativeBlockingNumber = [];
  }

  getOuterEdge(position: OuterEdge): HalfEdge {
    return position === OuterEdge.PREV ? this.innerEdge.prev : this.innerEdge.next;
  }

  getX(): HalfEdge[] {
    return [this.getOuterEdge(OuterEdge.PREV), this.innerEdge, this.getOuterEdge(OuterEdge.NEXT)];
  }

  getTrack(outerEdge: OuterEdge): Line {
    if (outerEdge === OuterEdge.PREV)
      return new Line(this.innerEdge.getTail(), this.getOuterEdge(OuterEdge.PREV).getAngle());
    else return new Line(this.innerEdge.getHead(), this.getOuterEdge(OuterEdge.NEXT).getAngle());
  }

  getTracks(): Line[] {
    return [this.getTrack(OuterEdge.PREV), this.getTrack(OuterEdge.NEXT)];
  }

  /**
   * Gets the point which is a possible and valid contraction point for an edge move.
   * @param outerEdge The edge which should be used as track for the edge move.
   * @returns A {@link Point}, posing a configuration's contraction point.
   */
  getContractionPoints(): ContractionPoints {
    type PointCandidate = {
      point: Point;
      dist: number;
    };

    const pointCandidates: PointCandidate[] = [];
    const A = this.innerEdge.prev.getTail().toPoint();
    const D = this.innerEdge.next.getHead().toPoint();
    const innerEdgeNormal = this.innerEdge.getVector().getNormal().getUnitVector();

    if (this.innerEdge.getInflectionType() === InflectionType.B) {
      const T = this.getTrack(OuterEdge.PREV).intersectsLine(this.getTrack(OuterEdge.NEXT));
      if (T) {
        const distT = new Vector2D(
          this.innerEdge.getTail().x - T.x,
          this.innerEdge.getTail().y - T.y
        ).dot(innerEdgeNormal);
        pointCandidates.push({ point: T, dist: distT });
      }
    }

    pointCandidates.push({ point: A, dist: this.innerEdge.prev.getVector().dot(innerEdgeNormal) });
    pointCandidates.push({
      point: D,
      dist: this.innerEdge.next.twin.getVector().dot(innerEdgeNormal),
    });

    // find closest contraction point in respect to the configurations inner edge
    pointCandidates.sort((a, b) => a.dist - b.dist);
    const pos = pointCandidates.filter((candidate) => candidate.dist >= 0)[0];
    const neg = pointCandidates.filter((candidate) => candidate.dist < 0).pop();

    //TODO: check whether or not the points are valid (the contraction is feasible, no blocking point exists)
    const validPoints: ContractionPoints = {
      [Contraction.POS]: pos ? pos.point : undefined,
      [Contraction.NEG]: neg ? neg.point : undefined,
    };
    if (pos && this.isValidContractionPoint(pos.point)) console.log("valid pos");
    if (neg && this.isValidContractionPoint(neg.point)) console.log("valid neg");
    return validPoints;
  }

  /**
   * Determines whether or not the Point is a valid contraction point.
   * @param configuration A {@link Configuration} for which the validity of the {@link Point} is determined.
   * @returns A Boolean indicating whether or not the {@link Point} is a valid.
   */
  isValidContractionPoint(point: Point): boolean {
    // check whether or not the point is equivalent to the configuration's first and last vertex
    const startPoint = this.getOuterEdge(OuterEdge.PREV).getTail();
    const endPoint = this.getOuterEdge(OuterEdge.NEXT).getHead();
    if (
      point.xy().every((pos) => startPoint.xy().includes(pos)) ||
      point.xy().every((pos) => endPoint.xy().includes(pos))
    )
      return true;

    // check whether or not the point is on any edge of the face's boundary which is not part of X
    return this.innerEdge
      .getCycle()
      .filter((edge) => !this.getX().includes(edge))
      .every((edge) => !point.isOnLineSegment(new LineSegment(edge.getTail(), edge.getHead())));
  }

  // negative for negative contraction areas, positive for positive ones?
  getContractionAreas(): number[] {
    return [10, -10];
  }
}

export default Configuration;
