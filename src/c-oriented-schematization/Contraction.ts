import HalfEdge, { InflectionType } from "../DCEL/HalfEdge";
import Point from "../geometry/Point";
import Line from "../geometry/Line";
import LineSegment from "../geometry/LineSegment";
import Polygon from "../geometry/Polygon";
import Vector2D from "../geometry/Vector2D";
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
  blockingNumber: number;

  constructor(
    configuration: Configuration,
    contractionType: ContractionType,
    point: Point,
  ) {
    this.type = contractionType;
    this.configuration = configuration;
    this.point = point;
    this.areaPoints = this.getAreaPoints();
    this.area = this.getArea();
    this.blockingNumber = this.initializeBlockingNumber();
  }

  static initialize(
    configuration: Configuration,
    contractionType: ContractionType,
  ): Contraction | undefined {
    const point = this.getPoint(configuration, contractionType);
    return point
      ? new Contraction(configuration, contractionType, point)
      : undefined;
  }

  isFeasible(): boolean {
    if (!this.point) return false;
    return this.area === 0 || (this.area > 0 && this.blockingNumber === 0)
      ? true
      : false;
  }

  isComplementary(other: Contraction): boolean {
    return this.type !== other.type;
  }

  getOverlappingEdges(other: Contraction): HalfEdge[] {
    return this.configuration
      .getX()
      .filter((edge) => other.configuration.getX().includes(edge));
  }

  /**
   * Determines whetere or not not the contraction conflicts with the specified complementary contraction.
   * @param complementary The complementary {@link Contraction} of the {@link ConfigurationPair}.
   * @returns A boolean, indicating whether or not the pair of contractions conflict.
   */
  isConflicting(complementary: Contraction): boolean | undefined {
    const overlappingEdges = this.getOverlappingEdges(complementary);
    const contractionX = this.configuration.getX();
    const complementaryX = complementary.configuration.getX();
    const outerEdges = [
      contractionX[0],
      contractionX[2],
      complementaryX[0],
      complementaryX[2],
    ];
    if (!overlappingEdges.length) return false;
    if (
      overlappingEdges.length === 1 &&
      outerEdges.some((edge) => edge.getInflectionType() === InflectionType.B)
    )
      return false;
    return true;
  }

  /**
   * Gets the point which is a possible and valid contraction point for an edge move.
   * @param outerEdge The edge which should be used as track for the edge move.
   * @returns A {@link Point}, posing a configuration's contraction point.
   */
  static getPoint(
    configuration: Configuration,
    type: ContractionType,
  ): Point | undefined {
    type PointCandidate = {
      point: Point;
      dist: number;
    };

    const pointCandidates: PointCandidate[] = [];

    const innerEdgeNormal = configuration.innerEdge
      .getVector()
      ?.getNormal()
      .getUnitVector();
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
          configuration.innerEdge.tail.y - T.y,
        ).dot(innerEdgeNormal);
        pointCandidates.push({ point: T, dist: distT });
      }
    }

    const distA = configuration.innerEdge.prev
      ?.getVector()
      ?.dot(innerEdgeNormal);
    if (typeof distA === "number")
      pointCandidates.push({
        point: A,
        dist: distA,
      });
    const distD = configuration.innerEdge.next?.twin
      ?.getVector()
      ?.dot(innerEdgeNormal);
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

    if (
      !prev ||
      !prevHead ||
      !nextHead ||
      typeof innerEdgeAngle !== "number" ||
      !innerEdgeHead
    )
      return [];
    const outerEdgePrevSegment = new LineSegment(prev.tail, prevHead);
    const innerEdge_ = new Line(this.point, innerEdgeAngle);
    let areaPoints;

    if (this.point.isOnLineSegment(outerEdgePrevSegment)) {
      areaPoints = [
        this.point,
        c.innerEdge.tail.toPoint(),
        innerEdgeHead.toPoint(),
      ];
      if (this.point.equals(prev.tail)) {
        const point = c.getTrack(OuterEdge.NEXT)?.intersectsLine(innerEdge_);
        point && areaPoints.push(point);
      }
    } else {
      areaPoints = [
        this.point,
        innerEdgeHead.toPoint(),
        c.innerEdge.tail.toPoint(),
      ];
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

  /**
   * Determines whether or not the specified HalfEdge blocks the contraction.
   * @param edge The {@link HalfEdge}
   * @returns A boolean, indicating whether or not the {@link Contraction} is blocked by the specified {@link HalfEdge}.
   */
  isBlockedBy(edge: HalfEdge): boolean | undefined {
    const x = this.configuration.getX();
    const x_ = this.configuration.innerEdge.twin?.configuration?.getX();
    if (x_) x.push(...x_);
    if (x.includes(edge)) return false;
    const edgeLine = edge.toLineSegment();
    if (!edgeLine) return;
    const area = new Polygon(this.areaPoints);
    const pointsInPolygon = edge
      .getEndpoints()
      .filter((vertex) => vertex.isInPolygon(area));
    const intersections = area.getIntersections(edge);
    const xLineSegments = x.reduce((acc: LineSegment[], edge) => {
      const lineSegment = edge.toLineSegment();
      if (typeof lineSegment === "object") acc.push(lineSegment);
      return acc;
    }, []);

    // return true, if both endpoints of the edge reside within the contraction area
    // (i.e., the edge resides entirely within contraction area)
    // or if one intersection of the edge and the contraction area boundaries is not part of X
    if (
      pointsInPolygon.length == 2 ||
      (intersections &&
        intersections.some(
          (intersection) => !intersection.isOnLineSegments(xLineSegments),
        ))
    )
      return true;
    // TODO: make specs
    return false;
  }

  /**
   * Initializes the blocking number of the Contraction.
   * @returns A number, indicating how many {@link HalfEdge}s block the {@link Contraction}.
   */
  initializeBlockingNumber(): number {
    let blockingNumber = 0;
    if (!this.point) return blockingNumber;

    this.configuration.getX_().forEach((boundaryEdge) => {
      if (this.isBlockedBy(boundaryEdge)) {
        blockingNumber++;
      }
    });

    return blockingNumber;
  }

  /**
   * Discards the contribution that the edges of X1 and X2 made to the blocking numbers, as a preliminary step for an edge-move.
   * @param x1x2 An array of {@link Halfedge}s involved in the edge-move.
   */
  decrementBlockingNumber(x1x2: HalfEdge[]) {
    if (this.blockingNumber === 0) return; // skip check for interference when no blocking point exists
    const decrement = x1x2.reduce((acc: number, edge) => {
      if (this.isBlockedBy(edge)) ++acc;
      return acc;
    }, 0);
    this.blockingNumber = this.blockingNumber - decrement;
  }

  /**
   * Adds the contribution to the blocking numbers for the edges that changed during the contraction (i.e., the remaining edges of X1 and X2) edge-move.
   * @param x1x2 An array of {@link HalfEdges} that changed during the contraction.
   */
  incrementBlockingNumber(x1x2: HalfEdge[]) {
    const increment = x1x2.reduce((acc: number, edge) => {
      // console.log("---->", this.configuration.innerEdge.toString());

      if (this.isBlockedBy(edge)) {
        // console.log("blocking edge", edge.toString());
        ++acc;
      }
      return acc;
    }, 0);
    this.blockingNumber = this.blockingNumber + increment;
  }

  getCompensationHeight(contractionArea: number): number | undefined {
    const a = this.configuration.innerEdge;
    const aLength = a.getLength();
    if (!a.face || !aLength) return;
    const alpha1 = a.tail.getExteriorAngle(a.face);
    const alpha2 = a.getHead()?.getExteriorAngle(a.face);
    if (typeof alpha1 !== "number" || typeof alpha2 !== "number") return;
    const alpha1_ = -Math.abs(alpha1) + Math.PI * 0.5;
    const alpha2_ = -Math.abs(alpha2) + Math.PI * 0.5;
    if (alpha1_ === 0 && alpha2_ === 0) {
      return contractionArea / aLength;
    } else {
      const p = (aLength * 2) / (Math.tan(alpha1_) + Math.tan(alpha2_));
      const q =
        (-contractionArea * 2) / (Math.tan(alpha1_) + Math.tan(alpha2_));
      return -p * 0.5 + Math.sqrt(Math.pow(p * 0.5, 2) - q);
    }
  }
}

export default Contraction;
