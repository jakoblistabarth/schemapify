import HalfEdge, { InflectionType } from "../DCEL/HalfEdge";
import Line from "../geometry/Line";
import LineSegment from "../geometry/LineSegment";
import Point from "../geometry/Point";
import Vector2D from "../geometry/Vector2D";
import { crawlArray, getPolygonArea } from "../utilities";
import Configuration, { OuterEdge } from "./Configuration";

export enum ContractionType {
  P = "positive",
  N = "negative",
}

class Contraction {
  type: ContractionType;
  configuration: Configuration;
  point: Point;
  areaPoints: Point[];
  area: number;
  blockingEdges: HalfEdge[];

  constructor(configuration: Configuration, contractionType: ContractionType) {
    this.type = contractionType;
    this.configuration = configuration;
    this.point = this.getPoint();
    this.areaPoints = this.getAreaPoints();
    this.area = this.getArea();
    this.blockingEdges = this.getBlockingEdges();
  }

  static initialize(
    configuration: Configuration,
    contractionType: ContractionType
  ): Contraction | undefined {
    const e = configuration.innerEdge;
    return e.getInflectionType() === InflectionType.B ||
      (contractionType === ContractionType.N && e.getInflectionType() === InflectionType.C) ||
      (contractionType === ContractionType.P && e.getInflectionType() === InflectionType.R)
      ? new Contraction(configuration, contractionType)
      : undefined;
  }

  isFeasible(): boolean {
    if (!this.point) return false;
    return this.blockingEdges.length === 0 ? true : false;
  }

  isComplementary(other: Contraction): boolean {
    return this.type !== other.type;
  }

  /**
   * Gets the point which is a possible and valid contraction point for an edge move.
   * @param outerEdge The edge which should be used as track for the edge move.
   * @returns A {@link Point}, posing a configuration's contraction point.
   */
  getPoint(): Point {
    type PointCandidate = {
      point: Point;
      dist: number;
    };

    const pointCandidates: PointCandidate[] = [];

    const c = this.configuration;
    const innerEdgeNormal = c.innerEdge.getVector().getNormal().getUnitVector();
    const A = c.innerEdge.prev.getTail().toPoint();
    const D = c.innerEdge.next.getHead().toPoint();

    if (c.innerEdge.getInflectionType() === InflectionType.B) {
      const T = c.getTrack(OuterEdge.PREV).intersectsLine(c.getTrack(OuterEdge.NEXT));
      if (T) {
        const distT = new Vector2D(
          c.innerEdge.getTail().x - T.x,
          c.innerEdge.getTail().y - T.y
        ).dot(innerEdgeNormal);
        pointCandidates.push({ point: T, dist: distT });
      }
    }

    pointCandidates.push({ point: A, dist: c.innerEdge.prev.getVector().dot(innerEdgeNormal) });
    pointCandidates.push({
      point: D,
      dist: c.innerEdge.next.twin.getVector().dot(innerEdgeNormal),
    });

    // find closest contraction point in respect to the configurations inner edge
    pointCandidates.sort((a, b) => a.dist - b.dist);
    return this.type === ContractionType.P
      ? pointCandidates.filter((candidate) => candidate.dist >= 0)[0].point
      : pointCandidates.filter((candidate) => candidate.dist < 0).pop().point;
  }

  getAreaPoints(): Point[] {
    const c = this.configuration;
    const prev = c.getOuterEdge(OuterEdge.PREV);
    const outerEdgePrevSegment = new LineSegment(prev.getTail(), prev.getHead());
    const innerEdge_ = new Line(this.point, c.innerEdge.getAngle());
    let contractionPoints;

    if (this.point.isOnLineSegment(outerEdgePrevSegment)) {
      contractionPoints = [
        this.point,
        c.innerEdge.getTail().toPoint(),
        c.innerEdge.getHead().toPoint(),
      ];
      if (this.point.equals(prev.getTail()))
        contractionPoints.push(c.getTrack(OuterEdge.NEXT).intersectsLine(innerEdge_));
    } else {
      contractionPoints = [
        this.point,
        c.innerEdge.getHead().toPoint(),
        c.innerEdge.getTail().toPoint(),
      ];
      if (this.point.equals(c.getOuterEdge(OuterEdge.NEXT).getHead()))
        contractionPoints.push(c.getTrack(OuterEdge.PREV).intersectsLine(innerEdge_));
    }
    return contractionPoints;
  }

  getArea(): number {
    return getPolygonArea(this.getAreaPoints());
  }

  getBlockingEdges(): HalfEdge[] {
    const blockingEdges: HalfEdge[] = [];
    if (!this.getPoint()) return blockingEdges;
    const areaPoints = this.getAreaPoints();

    const contractionAreaP = areaPoints.map(
      (point, idx) => new LineSegment(point, crawlArray(areaPoints, idx, +1))
    );

    this.configuration.getX_().forEach((boundaryEdge) => {
      // add edges which resides entirely in the contraction area
      if (boundaryEdge.getEndpoints().every((point) => point.isInPolygon(areaPoints))) {
        blockingEdges.push(boundaryEdge);
      }

      // add edges which resides partially in the contraction area
      contractionAreaP.forEach((edge) => {
        const intersection = boundaryEdge.toLineSegment().intersectsLineSegment(edge);
        if (intersection && areaPoints.every((p) => !p.equals(intersection))) {
          blockingEdges.push(boundaryEdge);
        }
      });
    });

    return blockingEdges;
  }

  doEdgeMove(): void {
    if (this.configuration.hasJunction()) return;
    console.log(this.type);
  }
}

export default Contraction;
