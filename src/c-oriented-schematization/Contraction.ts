import HalfEdge, { InflectionType } from "../Dcel/HalfEdge";
import Vertex from "../Dcel/Vertex";
import { EPSILON } from "../geometry/constants";
import Line from "../geometry/Line";
import LineSegment from "../geometry/LineSegment";
import Point from "../geometry/Point";
import Polygon from "../geometry/Polygon";
import Ring from "../geometry/Ring";
import Vector2D from "../geometry/Vector2D";
import Configuration, { OuterEdge } from "./Configuration";
import { ContractionType } from "./ContractionType";

/**
 * The parts of a blocking check which do not depend on the edge being checked.
 */
type BlockingContext = {
  /** The configuration's own edges, plus those of its twin's configuration. */
  x: HalfEdge[];
  areaPoints: Point[];
  area: Polygon;
  xLineSegments: LineSegment[];
  hasTrackPointOutsideOfX: boolean;
  /** The area's extent, grown by EPSILON so that near-touching edges survive it. */
  areaBounds: { minX: number; minY: number; maxX: number; maxY: number };
};

/**
 * Determines whether the HalfEdge is one of the given HalfEdges, or the twin of one.
 * Two configurations on opposite sides of an edge hold a half edge and its twin
 * rather than the same one, so comparing by identity alone misses what they share.
 * @param edge The {@link HalfEdge} to look for.
 * @param candidates The {@link HalfEdge}s to look in.
 * @returns A boolean, indicating whether the edge is among the candidates.
 */
const isOneOf = (edge: HalfEdge, candidates: HalfEdge[]) =>
  candidates.some((candidate) => candidate === edge || candidate === edge.twin);

class Contraction {
  type: ContractionType;
  configuration: Configuration;
  point: Point;
  blockingNumber: number;

  constructor(
    configuration: Configuration,
    contractionType: ContractionType,
    point: Point,
    configurations: Map<string, Configuration>,
  ) {
    this.type = contractionType;
    this.configuration = configuration;
    this.point = point;
    this.blockingNumber = this.initializeBlockingNumber(configurations);
  }

  /**
   * Initializes a Contraction.
   * @param configuration The {@link Configuration} on which the contraction (particular edge move) is performed.
   * @param contractionType The {@link ContractionType} of the to performed contraction (particular edge move).
   * @returns A {@link Contraction} instance.
   */
  static initialize(
    configuration: Configuration,
    contractionType: ContractionType,
    configurations: Map<string, Configuration>,
  ): Contraction | undefined {
    const point = this.getPoint(configuration, contractionType);
    return point
      ? new Contraction(
          configuration,
          contractionType,
          point.point,
          configurations,
        )
      : undefined;
  }

  /**
   * Determines whether or not the Contraction is feasible.
   * A contraction must have positive area to be feasible, since zero-area
   * contractions (where a vertex is collinear) don't simplify the geometry.
   * @returns A boolean, indicating whether or not the Contraction is feasible.
   */
  get isFeasible() {
    if (!this.point) return false;
    return this.area > 0 &&
      this.blockingNumber === 0 &&
      //TO-DO: remove these conditions, as soon as edge moves
      // for junctions (degree-3) are implemented
      !this.configuration.hasJunction &&
      !this.endsAtJunction
      ? true
      : false;
  }

  /**
   * Determines whether the Contraction slides an endpoint of the inner edge onto a junction.
   *
   * The contraction ends where one of the outer edges vanishes, which merges that outer
   * edge's far endpoint with the inner edge. Is that endpoint a junction, its remaining
   * edges decide where the inner edge may go – a case distinction which is not implemented
   * yet. Without it the inner edge can come to lie on top of one of those edges.
   * @returns A boolean, indicating whether or not the Contraction ends on a junction.
   */
  private get endsAtJunction() {
    const { prev, next } = this.configuration.innerEdge;
    return [prev?.tail, next?.head].some(
      (vertex) => !!vertex && vertex.degree > 2 && this.point.equals(vertex),
    );
  }

  /**
   * Determines whether or not the Contraction is complementary to the specified Contraction.
   * @param other The other {@link Contraction} to be compared.
   * @returns A boolean, indicating whether or not the Contraction is complementary.
   */
  isComplementary(other: Contraction) {
    return this.type !== other.type;
  }

  /**
   * Gets the overlapping edges of the Contraction and the specified complementary Contraction.
   * @param other The complementary {@link Contraction} of the {@link ConfigurationPair}.
   * @returns An array of {@link HalfEdge}s, representing the overlapping edges.
   */
  getOverlappingEdges(other: Contraction) {
    return this.configuration.x.filter((edge) =>
      isOneOf(edge, other.configuration.x),
    );
  }

  /**
   * Determines whether or not the contraction conflicts with the specified complementary contraction.
   * @param complementary The complementary {@link Contraction} of the {@link ConfigurationPair}.
   * @returns A boolean, indicating whether or not the pair of contractions conflict.
   */
  isConflicting(complementary: Contraction) {
    const overlappingEdges = this.getOverlappingEdges(complementary);
    const contractionX = this.configuration.x;
    const complementaryX = complementary.configuration.x;
    const outerEdges = [
      contractionX[0],
      contractionX[2],
      complementaryX[0],
      complementaryX[2],
    ];
    const hasOverlappingEdges = overlappingEdges.length > 0;
    if (!hasOverlappingEdges) return false;
    // "Two configurations conflict when they share an edge, unless they share only outer edges and one of these has a convex and a reflex vertex."
    const overlappingInnerEdges = overlappingEdges.filter((overlappingEdge) =>
      isOneOf(overlappingEdge, [
        this.configuration.innerEdge,
        complementary.configuration.innerEdge,
      ]),
    );
    // isConflicting if overlapping edges are inner edge
    if (overlappingInnerEdges.length > 0) return true;
    const overlappingOuterEdges = overlappingEdges.filter((overlappingEdge) =>
      isOneOf(overlappingEdge, outerEdges),
    );
    if (
      overlappingOuterEdges.some(
        (edge) => edge.getInflectionType() === InflectionType.B,
      )
    )
      return false;
    return true;
  }

  /**
   * Gets the point which is a possible and valid contraction point for an edge move.
   * @param configuration The {@link Configuration} to be used for the edge move.
   * @returns A {@link Point}, posing a configuration's contraction point.
   */
  static getPoint(configuration: Configuration, type: ContractionType) {
    type PointCandidate = {
      point: Point;
      dist: number;
      vanishing: OuterEdge.NEXT | OuterEdge.PREV | "inner";
    };

    const pointCandidates: PointCandidate[] = [];

    const innerEdgeNormal = configuration.innerEdge
      .getVector()
      ?.getNormal().unitVector;
    const A = configuration.innerEdge.prev?.tail.toPoint();
    const D = configuration.innerEdge.next?.head?.toPoint();
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
        pointCandidates.push({ point: T, dist: distT, vanishing: "inner" });
      }
    }

    const distA = configuration.innerEdge.prev
      ?.getVector()
      ?.dot(innerEdgeNormal);
    if (typeof distA === "number")
      pointCandidates.push({
        point: A,
        dist: distA,
        vanishing: OuterEdge.PREV,
      });
    const distD = configuration.innerEdge.next?.twin
      ?.getVector()
      ?.dot(innerEdgeNormal);
    if (typeof distD === "number")
      pointCandidates.push({
        point: D,
        dist: distD,
        vanishing: OuterEdge.NEXT,
      });

    // Find closest contraction point in respect to the configurations inner edge
    pointCandidates.sort((a, b) => a.dist - b.dist);
    return type === ContractionType.P
      ? pointCandidates.filter((candidate) => candidate.dist >= 0).shift()
      : pointCandidates.filter((candidate) => candidate.dist <= 0).pop();
  }

  /**
   * Gets the area points of the Contraction.
   * @returns An array of {@link Point}s representing the area points of the Contraction.
   */
  get areaPoints() {
    const c = this.configuration;
    const prev = c.getOuterEdge(OuterEdge.PREV);
    const prevHead = prev?.head;
    const next = c.getOuterEdge(OuterEdge.NEXT);
    const nextHead = next?.head;
    const innerEdgeHead = c.innerEdge.head;
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
        if (point) areaPoints.push(point);
      }
    } else {
      areaPoints = [
        this.point,
        innerEdgeHead.toPoint(),
        c.innerEdge.tail.toPoint(),
      ];
      if (this.point.equals(nextHead)) {
        const point = c.getTrack(OuterEdge.PREV)?.intersectsLine(innerEdge_);
        if (point) areaPoints.push(point);
      }
    }

    return areaPoints;
  }

  /**
   * Gets the area of the Contraction.
   * @returns A number, indicating the area of the Contraction.
   */
  get area() {
    return this.areaPoints ? new Ring(this.areaPoints).area : 0;
  }

  /**
   * Determines whether or not the specified HalfEdge blocks the contraction.
   *
   * This method performs edge-based geometric blocking checks:
   * - Case 1: Both endpoints of the edge lie inside the contraction area.
   * - Case 2: The edge crosses the boundary at non-X locations (improper crossing) regardless of endpoints.
   *
   * ARCHITECTURAL NOTE: Adjacent vertex checking is NOT performed here.
   * "Adjacent vertex checking" means: checking if vertices from adjacent faces (faces sharing
   * boundary edges with the current configuration's face) get trapped inside the contraction area.
   * Although such vertices might also block the contraction (implemented in initializeBlockingNumber),
   * we cannot include that check here because:
   * 1. This method is called during DCEL modifications (in decrementBlockingNumber/incrementBlockingNumber)
   * 2. Adjacent vertex checks require calling x_ getter, which calls getCycle()
   * 3. getCycle() performs cycle detection that fails when DCEL is in flux during edge moves
   * 4. This would crash decrementBlockingNumber/incrementBlockingNumber operations
   *
   * Therefore, edge-based geometric checks are the ONLY safe blocking mechanism for use during
   * DCEL modifications, while the more comprehensive adjacent vertex checking is restricted
   * to initializeBlockingNumber when the DCEL structure is stable.
   *
   * @param edge The {@link HalfEdge}
   * @returns A boolean, indicating whether or not the {@link Contraction} is blocked by the specified {@link HalfEdge}.
   */
  isBlockedBy(edge: HalfEdge, configurations: Map<string, Configuration>) {
    const context = this.getBlockingContext(configurations);
    return context && this.isBlockedByEdge(edge, context);
  }

  /**
   * Collects what a blocking check needs but does not derive from the edge
   * being checked, so that a sweep over many edges derives it only once.
   * @param configurations The {@link Configuration}s of the {@link Dcel}.
   * @returns A {@link BlockingContext}, or undefined if the inner edge has no twin.
   */
  private getBlockingContext(
    configurations: Map<string, Configuration>,
  ): BlockingContext | undefined {
    const twin = this.configuration.innerEdge.twin;
    if (!twin) return;
    const x = this.configuration.x;
    const xOfTwin = twin.coordKey
      ? configurations.get(twin.coordKey)?.x
      : undefined;
    if (xOfTwin) x.push(...xOfTwin);
    // The getter walks the configuration's tracks, so it is read only once.
    const areaPoints = this.areaPoints;
    return {
      x,
      areaPoints,
      area: new Polygon([new Ring(areaPoints)]),
      xLineSegments: x.reduce((acc: LineSegment[], edge) => {
        const lineSegment = edge.toLineSegment();
        if (typeof lineSegment === "object") acc.push(lineSegment);
        return acc;
      }, []),
      hasTrackPointOutsideOfX:
        areaPoints.length === 4 &&
        !this.configuration.x
          .flatMap((e) => e.endpoints)
          .some((v) => v.equals(areaPoints[3])),
      areaBounds: {
        minX: Math.min(...areaPoints.map(({ x }) => x)) - EPSILON,
        minY: Math.min(...areaPoints.map(({ y }) => y)) - EPSILON,
        maxX: Math.max(...areaPoints.map(({ x }) => x)) + EPSILON,
        maxY: Math.max(...areaPoints.map(({ y }) => y)) + EPSILON,
      },
    };
  }

  /**
   * Determines whether the specified HalfEdge blocks the contraction.
   * @param edge The {@link HalfEdge} to check.
   * @param context The edge-independent part of the check.
   * @returns A boolean, or undefined if the edge has no line segment.
   */
  private isBlockedByEdge(edge: HalfEdge, context: BlockingContext) {
    const {
      x,
      areaPoints,
      area,
      xLineSegments,
      hasTrackPointOutsideOfX,
      areaBounds,
    } = context;
    if (x.includes(edge)) return false;
    const edgeLine = edge.toLineSegment();
    if (!edgeLine) return;

    // An edge clear of the area's extent can neither lie in it nor cross it,
    // which spares the great majority of edges the geometry below.
    const { endPoint1, endPoint2 } = edgeLine;
    if (
      Math.min(endPoint1.x, endPoint2.x) > areaBounds.maxX ||
      Math.max(endPoint1.x, endPoint2.x) < areaBounds.minX ||
      Math.min(endPoint1.y, endPoint2.y) > areaBounds.maxY ||
      Math.max(endPoint1.y, endPoint2.y) < areaBounds.minY
    )
      return false;

    const pointsInPolygon = edge.endpoints.filter((vertex) =>
      vertex.isInPolygon(area),
    );

    // Case 1: Both endpoints inside the contraction area
    if (pointsInPolygon.length === 2) return true;

    //TODO: make robuster, seems to make algorithm stop too early at times.
    // Case 2: Improper boundary crossing (intersection not on X edges) blocks
    // Exception: if this is a 4-point area with P3 very close to an edge that
    // is part of the configuration (edge in X), it should not block.
    const hasImproperCrossing = area
      .getIntersections(edge)
      .some((intersection) => !intersection.isOnLineSegments(xLineSegments));
    const hasTrackPointCloseToEdge =
      areaPoints.length === 4 &&
      areaPoints[3].distanceToLineSegment(edgeLine) < EPSILON;

    return (
      hasImproperCrossing ||
      (hasTrackPointCloseToEdge && hasTrackPointOutsideOfX)
    );
  }

  /**
   * Initializes the blocking number of the Contraction.
   * @returns A number, indicating how many {@link HalfEdge}s block the {@link Contraction}.
   */
  initializeBlockingNumber(configurations: Map<string, Configuration>) {
    let blockingNumber = 0;
    if (!this.point) return blockingNumber;

    // Count boundary edges that block the contraction.
    // isBlockedBy handles all blocking scenarios:
    // - Case 1: Edges entirely inside the area
    // - Case 2: Improper boundary crossing (intersections at non-X edge points)
    // - Case 3: One endpoint inside with improper crossing
    // Read once: the getter walks the configuration's face cycle.
    const x_ = this.configuration.x_;
    const context = this.getBlockingContext(configurations);

    if (context)
      x_.forEach((boundaryEdge) => {
        if (this.isBlockedByEdge(boundaryEdge, context)) {
          blockingNumber++;
        }
      });

    // ARCHITECTURAL NOTE: Adjacent vertex checking is performed here (not in isBlockedBy)
    // because it requires calling x_ and getCycle(), which traverse the DCEL cycle.
    // These methods fail during DCEL modifications (in decrementBlockingNumber/incrementBlockingNumber).
    // Therefore, adjacent vertex checking must only run during initialization when the DCEL is stable.
    // Only edge-based blocking (Cases 1-3) can be used in decrementBlockingNumber/incrementBlockingNumber
    // since it operates on lightweight edge geometry that remains valid during DCEL modifications.

    // Check if any vertices from adjacent faces fall inside the contraction area.
    // The contraction area polygon might extend into adjacent faces, trapping vertices.
    // Get all vertices connected to the configuration's x_ boundary edges
    const boundaryVertices = new Set<Vertex>();
    x_.forEach((edge) => {
      boundaryVertices.add(edge.tail);
      if (edge.head) boundaryVertices.add(edge.head);
    });

    // Get all vertices from the configuration's own face
    const ownFaceVertices = new Set<Vertex>();
    const faceCycle = this.configuration.innerEdge.getCycle();
    Array.from(faceCycle).forEach((edge) => {
      ownFaceVertices.add(edge.tail);
      if (edge.head) ownFaceVertices.add(edge.head);
    });

    // Get all vertices from adjacent faces (via x_ edges)
    const adjacentFaceVertices = new Set<Vertex>();
    // Several x_ edges usually border the same face; walk each cycle once.
    const adjacentFaces = new Set(
      x_.flatMap((edge) => (edge.twin?.face ? [edge.twin.face] : [])),
    );
    adjacentFaces.forEach((adjacentFace) => {
      adjacentFace.getEdges().forEach((e) => {
        adjacentFaceVertices.add(e.tail);
        if (e.head) adjacentFaceVertices.add(e.head);
      });
    });

    // Check if any interior vertices (not on x_ boundary, not in own face) from adjacent faces fall inside the area
    const area = context?.area ?? new Polygon([new Ring(this.areaPoints)]);
    adjacentFaceVertices.forEach((vertex) => {
      // Skip if it's part of the configuration's boundary or its own face
      if (!boundaryVertices.has(vertex) && !ownFaceVertices.has(vertex)) {
        if (vertex.isInPolygon(area)) {
          blockingNumber++;
        }
      }
    });

    return blockingNumber;
  }

  /**
   * Discards the contribution that the edges of X1 and X2 made to the blocking numbers, as a preliminary step for an edge-move.
   *
   * ARCHITECTURAL NOTE: This method uses ONLY isBlockedBy() for edge-based blocking checks.
   * Adjacent vertex checking (performed in initializeBlockingNumber) is not repeated here because:
   * - This method is called during DCEL modifications when edges are being moved
   * - The x_ getter requires getCycle() which traverses the DCEL face cycle
   * - During modifications, the DCEL is in an unstable state and cycle detection fails
   * - Therefore, only lightweight edge geometry checks are safe to use here
   *
   * This is a design trade-off: we accept lightweight checks during active modifications,
   * while relying on comprehensive initialization checks when the DCEL is stable.
   *
   * @param x1x2 An array of {@link Halfedge}s involved in the edge-move.
   */
  decrementBlockingNumber(
    x1x2: HalfEdge[],
    configurations: Map<string, Configuration>,
  ) {
    if (this.blockingNumber === 0) return; // Skip check for interference when no blocking point exists
    const context = this.getBlockingContext(configurations);
    if (!context) return;
    const decrement = x1x2.reduce((acc: number, edge) => {
      if (this.isBlockedByEdge(edge, context)) ++acc;
      return acc;
    }, 0);
    this.blockingNumber = this.blockingNumber - decrement;
  }

  /**
   * Adds the contribution to the blocking numbers for the edges that changed during the contraction (i.e., the remaining edges of X1 and X2) edge-move.
   *
   * ARCHITECTURAL NOTE: This method uses ONLY isBlockedBy() for edge-based blocking checks,
   * for the same reasons as decrementBlockingNumber. See that method's documentation.
   *
   * @param x1x2 An array of {@link HalfEdges} that changed during the contraction.
   */
  incrementBlockingNumber(
    x1x2: HalfEdge[],
    configurations: Map<string, Configuration>,
  ) {
    const context = this.getBlockingContext(configurations);
    if (!context) return;
    const increment = x1x2.reduce((acc: number, edge) => {
      if (this.isBlockedByEdge(edge, context)) {
        ++acc;
      }
      return acc;
    }, 0);
    this.blockingNumber = this.blockingNumber + increment;
  }

  /**
   * Gets the compensation height of the Contraction.
   * @param contractionArea The area of the contraction.
   * @returns The height of the compensation.
   */
  getCompensationHeight(contractionArea: number) {
    const a = this.configuration.innerEdge;
    const aLength = a.getLength();
    if (!a.face || !aLength) return;

    const edgeVector = a.getVector()?.unitVector; // tail -> head
    const normal = edgeVector?.getNormal(this.type === ContractionType.N); // SAME normal used in the move
    if (!edgeVector || !normal) return;

    const prevTrack = this.configuration.getTrack(OuterEdge.PREV);
    const nextTrack = this.configuration.getTrack(OuterEdge.NEXT);
    if (!prevTrack || !nextTrack) return;
    const tTail = Vector2D.fromAngle(prevTrack.angle)?.unitVector;
    const tHead = Vector2D.fromAngle(nextTrack.angle)?.unitVector;
    if (!tTail || !tHead) return;

    const kTail = tTail.dot(edgeVector) / tTail.dot(normal);
    const kHead = tHead.dot(edgeVector) / tHead.dot(normal);
    const c = (kHead - kTail) / 2; // correct-sign coefficient

    if (Math.abs(c) < EPSILON) return contractionArea / aLength; // parallelogram case

    // c*h² + L*h − area = 0
    const disc = aLength * aLength + 4 * c * contractionArea;
    if (disc < 0) return;
    const sqrtD = Math.sqrt(disc);

    return [(-aLength + sqrtD) / (2 * c), (-aLength - sqrtD) / (2 * c)]
      .filter((h) => h > EPSILON && aLength + (kHead - kTail) * h >= -EPSILON) // valid, before track apex
      .sort((x, y) => x - y)[0];
  }
}

export default Contraction;
