import HalfEdge, { InflectionType } from "../DCEL/HalfEdge";
import Line from "../geometry/Line";
import LineSegment from "../geometry/LineSegment";
import Point from "../geometry/Point";
import Vector2D from "../geometry/Vector2D";
import { crawlArray } from "../utilities";

export enum OuterEdge {
  PREV = "prev",
  NEXT = "next",
}

export enum Contraction {
  POS = "positive",
  NEG = "negative",
}

export type ContractionPoints = {
  [Contraction.NEG]: Point | undefined;
  [Contraction.POS]: Point | undefined;
};

class Configuration {
  innerEdge: HalfEdge;
  BlockingNumbers: {
    [Contraction.NEG]: HalfEdge[];
    [Contraction.POS]: HalfEdge[];
  };

  constructor(edge: HalfEdge) {
    this.innerEdge = edge; // TODO: not very elegant, similar problem to saving the dcel explicitly to Vertices and HalfEdges.
    this.BlockingNumbers = {
      [Contraction.NEG]: [],
      [Contraction.POS]: [],
    };
  }

  getOuterEdge(position: OuterEdge): HalfEdge {
    return position === OuterEdge.PREV ? this.innerEdge.prev : this.innerEdge.next;
  }

  /**
   * Gets all 3 edges forming the configuration.
   * @returns An array of {@link HalfEdge}s.
   */
  getX(): HalfEdge[] {
    return [this.getOuterEdge(OuterEdge.PREV), this.innerEdge, this.getOuterEdge(OuterEdge.NEXT)];
  }

  /**
   * Gets all edges of the polygon's boundary to which the configuration belongs, unless the 3 edges forming the configuration.
   * Kind of the inverse to getX().
   * @returns An array of {@link HalfEdge}s.
   */
  getX_(): HalfEdge[] {
    return this.innerEdge.getCycle().filter((edge) => !this.getX().includes(edge));
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

    const validPoints: ContractionPoints = {
      [Contraction.POS]: pos ? pos.point : undefined,
      [Contraction.NEG]: neg ? neg.point : undefined,
    };

    return validPoints;
  }

  getContractionArea(contractionPoint: Point): Point[] {
    const prev = this.getOuterEdge(OuterEdge.PREV);
    const outerEdgePrevSegment = new LineSegment(prev.getTail(), prev.getHead());
    const innerEdge_ = new Line(contractionPoint, this.innerEdge.getAngle());
    if (contractionPoint.isOnLineSegment(outerEdgePrevSegment)) {
      const head_ = this.getTrack(OuterEdge.NEXT).intersectsLine(innerEdge_);
      return [
        contractionPoint,
        this.innerEdge.getTail().toPoint(),
        this.innerEdge.getHead().toPoint(),
        head_,
      ];
    } else {
      const tail_ = this.getTrack(OuterEdge.PREV).intersectsLine(innerEdge_);
      return [
        contractionPoint,
        this.innerEdge.getHead().toPoint(),
        this.innerEdge.getTail().toPoint(),
        tail_,
      ];
    }
  }

  setBlockingNumber(contraction: Contraction): HalfEdge[] {
    const blockingEdges: HalfEdge[] = [];
    if (!this.getContractionPoints()[contraction]) return blockingEdges;
    const area = this.getContractionArea(this.getContractionPoints()[contraction]);

    const contractionAreaP = area.map(
      (point, idx) => new LineSegment(point, crawlArray(area, idx, +1))
    );

    this.getX_().forEach((boundaryEdge) => {
      // add edges which resides entirely in the contraction area
      if (boundaryEdge.getEndpoints().every((point) => point.isInPolygon(area))) {
        blockingEdges.push(boundaryEdge);
      }

      // add edges which resides partially in the contraction area
      contractionAreaP.forEach((edge) => {
        const intersection = boundaryEdge.toLineSegment().intersectsLineSegment(edge);
        if (intersection && area.every((p) => !p.equals(intersection))) {
          blockingEdges.push(boundaryEdge);
        }
      });
    });

    return blockingEdges;
  }

  isFeasible(contraction: Contraction): boolean {
    if (!this.getContractionPoints()[contraction]) return false;
    return this.BlockingNumbers[contraction].length === 0 ? true : false;
  }
}

export default Configuration;
