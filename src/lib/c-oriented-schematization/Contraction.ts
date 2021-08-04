import HalfEdge, { InflectionType } from "../DCEL/HalfEdge";
import Point from "../geometry/Point";
import Line from "../geometry/Line";
import LineSegment from "../geometry/LineSegment";
import Polygon from "../geometry/Polygon";
import Vector2D from "../geometry/Vector2D";
import { crawlArray } from "../utilities";
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
    return !this.blockingEdges.length ? true : false;
  }

  isComplementary(other: Contraction): boolean {
    return this.type !== other.type;
  }

  isConflicting(complementary: Contraction): boolean | undefined {
    const overlappingEdges = this.configuration
      .getX()
      .filter((edge) => complementary.configuration.getX().includes(edge));
    if (!overlappingEdges.length) return false;
    if (
      overlappingEdges.length === 1 &&
      overlappingEdges[0].getInflectionType() === InflectionType.B
    )
      return false;
    return true;
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

    const innerEdgeNormal = configuration.innerEdge.getVector()?.getNormal().getUnitVector();
    const A = configuration.innerEdge.prev?.tail.toPoint();
    const D = configuration.innerEdge.next?.getHead()?.toPoint();
    const [trackPrev, trackNext] = [
      configuration.getTrack(OuterEdge.PREV),
      configuration.getTrack(OuterEdge.NEXT),
    ];
    if (!innerEdgeNormal || !A || !D || !trackPrev || !trackNext) return;

    if (configuration.innerEdge.getInflectionType() === InflectionType.B) {
      const T = trackPrev.intersectsLine(trackNext);
      if (T) {
        const distT = new Vector2D(
          configuration.innerEdge.tail.x - T.x,
          configuration.innerEdge.tail.y - T.y
        ).dot(innerEdgeNormal);
        pointCandidates.push({ point: T, dist: distT });
      }
    }

    const distA = configuration.innerEdge.prev?.getVector()?.dot(innerEdgeNormal);
    if (typeof distA === "number")
      pointCandidates.push({
        point: A,
        dist: distA,
      });
    const distD = configuration.innerEdge.next?.twin?.getVector()?.dot(innerEdgeNormal);
    if (typeof distD === "number")
      pointCandidates.push({
        point: D,
        dist: distD,
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
    const prevHead = prev?.getHead();
    const next = c.getOuterEdge(OuterEdge.NEXT);
    const nextHead = next?.getHead();
    const innerEdgeHead = c.innerEdge.getHead();
    const innerEdgeAngle = c.innerEdge.getAngle();

    if (!prev || !prevHead || !nextHead || typeof innerEdgeAngle !== "number" || !innerEdgeHead)
      return [];
    const outerEdgePrevSegment = new LineSegment(prev.tail, prevHead);
    const innerEdge_ = new Line(this.point, innerEdgeAngle);
    let areaPoints;

    if (this.point.isOnLineSegment(outerEdgePrevSegment)) {
      areaPoints = [this.point, c.innerEdge.tail.toPoint(), innerEdgeHead.toPoint()];
      if (this.point.equals(prev.tail)) {
        const point = c.getTrack(OuterEdge.NEXT)?.intersectsLine(innerEdge_);
        point && areaPoints.push(point);
      }
    } else {
      areaPoints = [this.point, innerEdgeHead.toPoint(), c.innerEdge.tail.toPoint()];
      if (this.point.equals(nextHead)) {
        const point = c.getTrack(OuterEdge.PREV)?.intersectsLine(innerEdge_);
        point && areaPoints.push(point);
      }
    }

    return areaPoints;
  }

  getArea(): number {
    return this.areaPoints ? new Polygon(this.areaPoints).area : 0;
  }

  getBlockingEdges(): HalfEdge[] {
    const blockingEdges: HalfEdge[] = [];
    if (!this.point) return blockingEdges;
    const area = new Polygon(this.areaPoints);
    const contractionAreaP = area.getLineSegments();

    this.configuration.getX_().forEach((boundaryEdge) => {
      const pointsInPolygon = boundaryEdge
        .getEndpoints()
        .filter((point) => point.isInPolygon(area));
      // add edges which resides entirely in the contraction area
      if (pointsInPolygon.length === 2) return blockingEdges.push(boundaryEdge);
      if (pointsInPolygon.length === 1) {
        contractionAreaP.forEach((areaEdge) => {
          const intersection = boundaryEdge.toLineSegment()?.intersectsLineSegment(areaEdge);

          if (
            intersection &&
            !blockingEdges.includes(boundaryEdge) &&
            !this.configuration.getX().some((xEdge) => {
              const lineOfX = xEdge.toLineSegment();
              return lineOfX && intersection?.isOnLineSegment(lineOfX);
            })
          )
            blockingEdges.push(boundaryEdge);
        });
      }
    });

    return blockingEdges;
  }

  doEdgeMove(): void {
    if (this.configuration.hasJunction()) return;
    console.log(this.type);
  }
}

export default Contraction;
