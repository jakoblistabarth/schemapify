import HalfEdge, { InflectionType } from "../Dcel/HalfEdge";
import Vertex from "../Dcel/Vertex";
import { isSameAngle, normalizeAngle } from "../utilities";
import { EPSILON } from "../geometry/constants";
import Line from "../geometry/Line";
import LineSegment from "../geometry/LineSegment";
import Point from "../geometry/Point";
import Polygon from "../geometry/Polygon";
import Ring from "../geometry/Ring";
import Vector2D from "../geometry/Vector2D";
import Configuration, { Junction, OuterEdge } from "./Configuration";
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
  /** Which of the configuration's edges the contraction makes vanish. */
  vanishing: OuterEdge | "inner";
  blockingNumber: number;
  /** The junctions the last move left a copy of, and the vertices it left them on. */
  copiesLeft: Vertex[] = [];

  constructor(
    configuration: Configuration,
    contractionType: ContractionType,
    point: Point,
    vanishing: OuterEdge | "inner",
    configurations: Map<string, Configuration>,
  ) {
    this.type = contractionType;
    this.configuration = configuration;
    this.point = point;
    this.vanishing = vanishing;
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
          point.vanishing,
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
    // Taken against the inner edge's length, which the area scales with the square of:
    // a contraction of a few square millimetres is the move standing still, and being
    // the smallest one going it is picked before any that would get somewhere.
    const length = this.configuration.innerEdge.getLength();
    if (!length || this.area <= EPSILON * length * length) return false;
    return this.area > 0 &&
      this.blockingNumber === 0 &&
      !this.hasUnhandledJunction &&
      //TO-DO: remove this condition, as soon as edge moves onto junctions
      // (degree-3) are implemented
      !this.endsAtJunction
      ? true
      : false;
  }

  /**
   * The edges leaving a junction on the inner edge which bound none of the faces the
   * configuration does. They stand in the move's way just as the boundary does, but
   * the face cycle never reaches them, so they are collected on their own.
   * @returns An array of {@link HalfEdge}s.
   */
  private get junctionEdges() {
    const { innerEdge } = this.configuration;
    return innerEdge.endpoints
      .filter((vertex) => vertex.degree > 2)
      .flatMap((vertex) => {
        // The edge the junction travels along carries the move rather than standing in
        // its way, and so does the boundary, which is counted on its own.
        const track = this.configuration.getJunctionTrackEdge(
          vertex,
          this.type,
        );
        const spared = [innerEdge, innerEdge.twin, track, track?.twin];
        return vertex.edges.filter(
          (edge) =>
            !spared.includes(edge) &&
            !this.configuration.x_.some(
              (boundary) => boundary === edge || boundary === edge.twin,
            ),
        );
      });
  }

  /**
   * Where the specified endpoint of the inner edge comes to rest after the move.
   * @param vertex One of the inner edge's endpoints.
   * @returns A {@link Point}, or nothing where the contraction has no destination.
   */
  private landingOf(vertex: Vertex) {
    const pointA = this.point;
    const pointB = this.areaPoints.at(-1);
    if (!pointA || !pointB) return;
    if (this.vanishing === "inner" || this.areaPoints.length === 3)
      return pointA;
    const [tail, head] =
      this.vanishing === OuterEdge.PREV ? [pointA, pointB] : [pointB, pointA];
    return vertex === this.configuration.innerEdge.tail ? tail : head;
  }

  /**
   * Leaves a copy of every junction the inner edge meets behind, so that the edges
   * which do not travel with it keep the vertex they have.
   *
   * Without it the junction's other edges are dragged along with the endpoint, which
   * changes their direction and the area of the faces beyond them.
   * @param tail Where the inner edge's tail is headed.
   * @param head Where its head is headed.
   */
  leaveJunctionsBehind(tail: Point, head: Point) {
    this.copiesLeft = [];
    const innerEdge = this.configuration.innerEdge;
    const ends: [Vertex | undefined, HalfEdge | undefined, Point, Point][] = [
      [innerEdge.tail, innerEdge, tail, head],
      [innerEdge.head, innerEdge.twin, head, tail],
    ];
    ends.forEach(([vertex, outgoing, landing, destination]) => {
      if (!vertex || !outgoing || vertex.degree <= 2) return;
      if (this.configuration.getJunctionType(vertex) === Junction.A) return;
      // The vertex stays put, so nothing is dragged along and no copy is needed.
      const heading = landing.vector.minus(vertex.vector);
      if (heading.magnitude < EPSILON) return;
      // The vertex travels along one of its own edges, which is the one to leave the
      // copy on. Derived from where the endpoint is actually headed rather than
      // worked out again, so the two cannot disagree.
      const track = vertex.edges.find((edge) => {
        if (edge === outgoing) return false;
        const angle = edge.getAngle();
        return (
          typeof angle === "number" &&
          isSameAngle(angle, normalizeAngle(heading.angle))
        );
      });
      if (!track)
        throw new Error(
          "Edge move sends a junction along none of its own edges",
        );
      const split = vertex.splitOff(outgoing, track, landing, destination);
      // Both of them bound different faces than they did, so whatever is configured
      // around them has to be worked out again.
      if (split) this.copiesLeft.push(vertex, split);
    });
  }

  /**
   * Determines whether the inner edge meets a junction the edge move cannot carry out.
   *
   * At a junction of type A the two edges the moving vertex does not belong to run in
   * opposite directions along one line — the very line the configuration takes its
   * track from — so the vertex slides along them and the faces on their far side keep
   * their area. The other types have the vertex leave a copy of itself behind, which
   * is not implemented yet.
   * @returns A boolean, indicating whether a junction stands in the move's way.
   */
  private get hasUnhandledJunction() {
    return this.configuration.innerEdge.endpoints.some((vertex) => {
      if (vertex.degree <= 2) return false;
      const junction = this.configuration.getJunctionType(vertex);
      if (junction === Junction.A) return false;
      // An edge lying along the inner edge's own line makes the contraction where the
      // outer edge vanishes cost nothing, sending the vertex down that line and
      // doubling the boundary back over itself.
      const innerAngle = this.configuration.innerEdge.getAngle();
      const doublesBack = vertex.edges.some((edge) => {
        if (isOneOf(edge, [this.configuration.innerEdge])) return false;
        const angle = edge.getAngle();
        return (
          typeof angle === "number" &&
          typeof innerAngle === "number" &&
          (isSameAngle(angle, innerAngle) ||
            isSameAngle(angle, normalizeAngle(innerAngle + Math.PI)))
        );
      });
      if (doublesBack) return true;
      // Both of the other types leave a copy behind on the edge the vertex travels
      // along. The landing has to fall short of that edge's far end: travelling it
      // whole hands the copy to the vertex there, which is the move onto a junction
      // the contraction does not support. Type C moved away from its edges has no
      // edge to travel along at all, only their extensions.
      const landing = this.landingOf(vertex);
      if (!landing) return true;
      const heading = landing.vector.minus(vertex.vector);
      if (heading.magnitude < EPSILON) return false;
      return !vertex.edges.some((edge) => {
        if (isOneOf(edge, [this.configuration.innerEdge])) return false;
        const [angle, length] = [edge.getAngle(), edge.getLength()];
        return (
          typeof angle === "number" &&
          typeof length === "number" &&
          isSameAngle(angle, normalizeAngle(heading.angle)) &&
          heading.magnitude < length - EPSILON
        );
      });
    });
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
    const innerAngle = this.configuration.innerEdge.getAngle();
    if (typeof innerAngle !== "number") return true;
    // An inner edge whose two tracks meet in the contraction point collapses there,
    // leaving no edge behind which could double the boundary back.
    const vanishes = this.areaPoints.length === 3;
    // The direction the inner edge leaves the vertex it lands on: onward for its
    // tail, backward for its head. The far end names where the edge's other
    // endpoint comes to rest.
    const { tail, head } = this.configuration.innerEdge;
    // On a small enough ring the two outer edges' far ends are one vertex, so only
    // the end the vanishing edge sends there is the one which lands.
    const ends: [Vertex | undefined, number, Vertex | undefined][] =
      this.vanishing === OuterEdge.PREV
        ? [[prev?.tail, innerAngle, head]]
        : [[next?.head, normalizeAngle(innerAngle + Math.PI), tail]];
    return ends.some(([vertex, onward, other]) => {
      if (!vertex || !this.point.equals(vertex)) return false;
      if (vertex.degree > 2) return true;
      if (vanishes || !other) return false;
      // Both endpoints landing on the vertex collapses the inner edge there,
      // leaving nothing behind which could double the boundary back.
      const farEnd = this.landingOf(other);
      if (farEnd?.equals(vertex)) return false;
      // The vertex reached may own an edge leaving it the same way the arriving
      // inner edge does. Coming to rest exactly on top of it the two cancel each
      // other out, anywhere short of that they double the boundary back over itself.
      return vertex.edges.some((edge) => {
        if (
          isOneOf(
            edge,
            [prev, next].filter((e) => e !== undefined),
          )
        )
          return false;
        const angle = edge.getAngle();
        if (typeof angle !== "number" || !isSameAngle(angle, onward))
          return false;
        return !(edge.head && farEnd?.equals(edge.head));
      });
    });
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
      configuration.getTrack(OuterEdge.PREV, type),
      configuration.getTrack(OuterEdge.NEXT, type),
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
        const point = c
          .getTrack(OuterEdge.NEXT, this.type)
          ?.intersectsLine(innerEdge_);
        if (point) areaPoints.push(point);
      }
    } else {
      areaPoints = [
        this.point,
        innerEdgeHead.toPoint(),
        c.innerEdge.tail.toPoint(),
      ];
      if (this.point.equals(nextHead)) {
        const point = c
          .getTrack(OuterEdge.PREV, this.type)
          ?.intersectsLine(innerEdge_);
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
      [...x_, ...this.junctionEdges].forEach((boundaryEdge) => {
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

    const prevTrack = this.configuration.getTrack(OuterEdge.PREV, this.type);
    const nextTrack = this.configuration.getTrack(OuterEdge.NEXT, this.type);
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
    // The discriminant is zero where the compensation takes on exactly the area asked
    // of it, shrinking its inner edge to a point. Derived from coordinates it lands
    // just short of zero as readily as just past it, so it is only taken as negative
    // once it is negative by more than the rounding its own magnitude carries.
    if (disc < -EPSILON * aLength * aLength) return;
    const sqrtD = Math.sqrt(Math.max(disc, 0));

    // Both heights are taken from the sum rather than one of them from the difference:
    // tracks running nearly parallel leave the quadratic a leading coefficient close
    // to zero, where the difference cancels away nearly every digit it has.
    const sum = -(aLength + (aLength < 0 ? -sqrtD : sqrtD)) / 2;
    if (!sum) return;
    const heights = [sum / c, -contractionArea / sum];
    return heights
      .filter((h) => h > EPSILON && aLength + (kHead - kTail) * h >= -EPSILON) // valid, before track apex
      .sort((x, y) => x - y)[0];
  }
}

export default Contraction;
