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

  constructor(configuration: Configuration, contractionType: ContractionType, point: Point) {
    this.type = contractionType;
    this.configuration = configuration;
    this.point = point;
    this.areaPoints = this.getAreaPoints();
    this.area = this.getArea();
    this.blockingEdges = this.getBlockingEdges();
  }

  static initialize(
    configuration: Configuration,
    contractionType: ContractionType
  ): Contraction | undefined {
    const point = this.getPoint(configuration, contractionType);
    return point ? new Contraction(configuration, contractionType, point) : undefined;
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
  static getPoint(configuration: Configuration, type: ContractionType): Point | undefined {
    type PointCandidate = {
      point: Point;
      dist: number;
    };

    const pointCandidates: PointCandidate[] = [];

    const innerEdgeNormal = configuration.innerEdge.getVector().getNormal().getUnitVector();
    const A = configuration.innerEdge.prev.getTail().toPoint();
    const D = configuration.innerEdge.next.getHead().toPoint();

    if (configuration.innerEdge.getInflectionType() === InflectionType.B) {
      const T = configuration
        .getTrack(OuterEdge.PREV)
        .intersectsLine(configuration.getTrack(OuterEdge.NEXT));
      if (T) {
        const distT = new Vector2D(
          configuration.innerEdge.getTail().x - T.x,
          configuration.innerEdge.getTail().y - T.y
        ).dot(innerEdgeNormal);
        pointCandidates.push({ point: T, dist: distT });
      }
    }

    pointCandidates.push({
      point: A,
      dist: configuration.innerEdge.prev.getVector().dot(innerEdgeNormal),
    });
    pointCandidates.push({
      point: D,
      dist: configuration.innerEdge.next.twin.getVector().dot(innerEdgeNormal),
    });

    // find closest contraction point in respect to the configurations inner edge
    pointCandidates.sort((a, b) => a.dist - b.dist);
    return type === ContractionType.P
      ? pointCandidates.filter((candidate) => candidate.dist >= 0)[0]?.point
      : pointCandidates.filter((candidate) => candidate.dist <= 0).pop()?.point;
  }

  getAreaPoints(): Point[] {
    const c = this.configuration;
    const prev = c.getOuterEdge(OuterEdge.PREV);
    const outerEdgePrevSegment = new LineSegment(prev.getTail(), prev.getHead());
    const innerEdge_ = new Line(this.point, c.innerEdge.getAngle());
    let areaPoints;

    if (this.point.isOnLineSegment(outerEdgePrevSegment)) {
      areaPoints = [this.point, c.innerEdge.getTail().toPoint(), c.innerEdge.getHead().toPoint()];
      if (this.point.equals(prev.getTail())) {
        const point = c.getTrack(OuterEdge.NEXT).intersectsLine(innerEdge_);
        point && areaPoints.push(point);
      }
    } else {
      areaPoints = [this.point, c.innerEdge.getHead().toPoint(), c.innerEdge.getTail().toPoint()];
      if (this.point.equals(c.getOuterEdge(OuterEdge.NEXT).getHead())) {
        const point = c.getTrack(OuterEdge.PREV).intersectsLine(innerEdge_);
        point && areaPoints.push(point);
      }
    }

    return areaPoints;
  }

  getArea(): number {
    return this.areaPoints ? getPolygonArea(this.areaPoints) : 0;
  }

  getBlockingEdges(): HalfEdge[] {
    const blockingEdges: HalfEdge[] = [];
    if (!this.point) return blockingEdges;
    const areaPoints = this.areaPoints;

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
