import Dcel from "../Dcel/Dcel";
import HalfEdge from "../Dcel/HalfEdge";
import { EPSILON } from "../geometry/constants";
import Line from "../geometry/Line";
import Point from "../geometry/Point";
import Vector2D from "../geometry/Vector2D";
import Configuration, { OuterEdge } from "./Configuration";
import Contraction from "./Contraction";
import { ConfigurationPurpose, ContractionType } from "./ContractionType";
import { isCollinearVertex } from "./VertexUtils";

/**
 * A pair of {@link Contraction}s, which are complementary and non-conflicting.
 * The {@link ConfigurationPair} is used to perform an edge move.
 */
class ConfigurationPair {
  [ConfigurationPurpose.CONTRACTION]: Contraction;
  [ConfigurationPurpose.COMPENSATION]: Contraction;

  constructor(contraction: Contraction, compensation: Contraction) {
    this.contraction = contraction;
    this.compensation = compensation;
  }

  /**
   * Get the shared edge as a {@link LineSegment}, if it exists.
   * This is used in the special case where the contraction and compensation share an outer edge, which requires a different handling in the edge move.
   * @returns The shared edge as a {@link LineSegment}, or undefined if no shared outer edge exists or if the DCEL links are incomplete.
   */
  getSharedSegment() {
    const sharedEdge = this.findSharedOuterEdge();
    if (!sharedEdge) return;
    return sharedEdge.toLineSegment();
  }

  /**
   * Get the non-shared tracks for both configurations.
   * @returns An object containing the non-shared tracks for each configuration.
   */
  getNonSharedTracks() {
    const sharedSegment = this.getSharedSegment();
    if (!sharedSegment) return;
    const contractionTracks = this.contraction.configuration.getTracks(
      this.contraction.type,
    );
    const compensationTracks = this.compensation.configuration.getTracks(
      this.compensation.type,
    );
    const contractionTrack = contractionTracks.find(
      (track) => track && !sharedSegment.isOnLine(track),
    );
    const compensationTrack = compensationTracks.find(
      (track) => track && !sharedSegment.isOnLine(track),
    );

    return {
      [ConfigurationPurpose.CONTRACTION]: contractionTrack,
      [ConfigurationPurpose.COMPENSATION]: compensationTrack,
    };
  }

  /**
   * Checks if the head of the given configuration type lies on the shared edge. This is only applicable when the configurations share an outer edge.
   * This is used to determine whether to use the shared edge move logic, which requires that at least one of the points lies on the shared edge.
   * @returns A boolean indicating whether the contraction head lies on the shared edge, or false if no shared edge exists.
   */
  hasHeadOnSharedEdge(configurationType: ConfigurationPurpose) {
    const sharedEdge = this.findSharedOuterEdge();
    const head =
      this.getConfiguration(configurationType).configuration.innerEdge.head;
    if (!sharedEdge?.head || !head) return false;
    return (
      head.equals(sharedEdge?.tail) ||
      (sharedEdge?.head && head?.equals(sharedEdge?.head))
    );
  }

  getConfiguration(configurationType: ConfigurationPurpose) {
    return configurationType === ConfigurationPurpose.CONTRACTION
      ? this.contraction
      : this.compensation;
  }

  /**
   * Solve for the meeting point and track distances when two configurations share an outer edge.
   * Returns undefined when the system is not solvable.
   *
   * Find meeting point using constraint that edge angle is constant
   * Constraints:
   * 1. Shared endpoint A moves along shared edge: A = shared_start + s * shared_vector
   * 2. Non-shared endpoint B moves along track: B = track_start + t * track_vector
   * 3. Edge vector (A - B) must be parallel to original edge (angle is constant)
   * 4. Area preservation: length × movement_distance × sin(angle) is balanced
   */
  getMeetingPoint() {
    const sharedSegment = this.getSharedSegment();
    if (!sharedSegment) return;

    const sharedVector = sharedSegment.endPoint2.vector.minus(
      sharedSegment.endPoint1.vector,
    );
    const sharedStart = sharedSegment.endPoint1.vector;

    const contractionEdge = this.contraction.configuration.innerEdge;
    const compensationEdge = this.compensation.configuration.innerEdge;

    // Get starting positions for non-shared endpoints
    const contractionNonSharedStart = this.hasHeadOnSharedEdge(
      ConfigurationPurpose.CONTRACTION,
    )
      ? contractionEdge.tail.vector
      : contractionEdge.head?.vector;

    const compensationNonSharedStart = this.hasHeadOnSharedEdge(
      ConfigurationPurpose.COMPENSATION,
    )
      ? compensationEdge.tail.vector
      : compensationEdge.head?.vector;

    if (!contractionNonSharedStart || !compensationNonSharedStart) return;

    const tracks = this.getNonSharedTracks();
    if (!tracks) return;
    const contractionTrack = tracks[ConfigurationPurpose.CONTRACTION];
    const compensationTrack = tracks[ConfigurationPurpose.COMPENSATION];
    if (!contractionTrack || !compensationTrack) return;

    // Each moving edge is a line with constant angle (original edge angle).
    // We solve for the intersection of the moving edge with the two track lines.
    const contractionEdgeAngle = contractionEdge.getAngle();
    const compensationEdgeAngle = compensationEdge.getAngle();
    if (
      contractionEdgeAngle === undefined ||
      compensationEdgeAngle === undefined
    )
      return;

    const contractionSegmentLength = contractionEdge.toLineSegment()?.length;
    const compensationSegmentLength = compensationEdge.toLineSegment()?.length;

    if (
      contractionSegmentLength === undefined ||
      contractionSegmentLength === 0 ||
      compensationSegmentLength === 0 ||
      compensationSegmentLength === undefined
    )
      return;

    // Area change for an edge move with constant angle (parallelogram/trapezoid area):
    // Area = edgeLength * distance_perpendicular
    // distance_perpendicular = actual_distance_along_shared_edge * sin(angle_between_shared_and_edge)
    // However, it's simpler to relate the displacement 's' along the shared edge to area.

    const sharedAngle = sharedVector.angle;
    const sinPhiContraction = Math.abs(
      Math.sin(contractionEdgeAngle - sharedAngle),
    );
    const sinPhiCompensation = Math.abs(
      Math.sin(compensationEdgeAngle - sharedAngle),
    );

    // For proportional area change along the shared edge:
    // displacement_contraction * length_contraction * sin(phi_contraction) = -displacement_compensation * length_compensation * sin(phi_compensation)
    // Note: This assumes points meet from opposite directions on the shared segment.

    const areaWeightContraction = contractionSegmentLength * sinPhiContraction;
    const areaWeightCompensation =
      compensationSegmentLength * sinPhiCompensation;

    if (areaWeightContraction < EPSILON || areaWeightCompensation < EPSILON)
      return;

    // We want the meeting point M such that area changes balance.
    // M = sharedStart + s * sharedVector
    // M must be reachable by both moving edges starting from their current shared endpoint.
    // The current shared endpoint for contraction is A_start.
    // The current shared endpoint for compensation is B_start (which is same as A_start).
    const sharedEndpoint = this.hasHeadOnSharedEdge(
      ConfigurationPurpose.CONTRACTION,
    )
      ? contractionEdge.head?.vector
      : contractionEdge.tail.vector;

    if (!sharedEndpoint) return;

    // Calculate current 's' for the shared endpoint
    const currentS =
      sharedEndpoint.minus(sharedStart).dot(sharedVector) /
      Math.pow(sharedVector.magnitude, 2);

    // The shared segment endpoints in 's' space are 0 and 1. Each inner edge is
    // attached to one of them and slides towards the other, collapsing the segment.
    const startS = Math.abs(currentS - 0) < EPSILON ? 0 : 1;
    const targetS = 1 - startS;

    // Both inner edges keep their angle, so their length varies linearly with how far
    // their shared endpoint has slid; sampling the far end pins that rate down.
    const lengthAtSharedEndpoint = (
      sharedEndpointPosition: Vector2D,
      angle: number,
      track: Line,
      direction: Vector2D,
    ) => {
      const landing = new Line(
        sharedEndpointPosition.toPoint(),
        angle,
      ).intersectsLine(track);
      if (!landing) return;
      // Measured along the direction the inner edge starts out in, rather than as a
      // distance: beyond the point where its two tracks meet the edge has flipped
      // over, and a distance would report it growing again from zero.
      return landing.vector.minus(sharedEndpointPosition).dot(direction);
    };

    const contractionSharedStart = sharedStart.plus(sharedVector.times(startS));
    const compensationSharedStart = sharedStart.plus(
      sharedVector.times(targetS),
    );
    const contractionLengthEnd = lengthAtSharedEndpoint(
      compensationSharedStart,
      contractionEdgeAngle,
      contractionTrack,
      contractionNonSharedStart.minus(contractionSharedStart).unitVector,
    );
    const compensationLengthEnd = lengthAtSharedEndpoint(
      contractionSharedStart,
      compensationEdgeAngle,
      compensationTrack,
      compensationNonSharedStart.minus(compensationSharedStart).unitVector,
    );
    if (
      contractionLengthEnd === undefined ||
      compensationLengthEnd === undefined
    )
      return;

    const contractionLengthChange =
      contractionLengthEnd - contractionSegmentLength;
    const compensationLengthChange =
      compensationLengthEnd - compensationSegmentLength;

    // Each swept region is a trapeze, not a parallelogram: with u the share of the
    // shared edge the contraction travels (and 1 - u the compensation's share),
    //   swept(u) = u * |shared| * sin(phi) * (length + u * lengthChange / 2)
    // Equating both swept areas leaves a quadratic in u.
    const quadratic =
      (sinPhiContraction * contractionLengthChange -
        sinPhiCompensation * compensationLengthChange) /
      2;
    const linear =
      sinPhiContraction * contractionSegmentLength +
      sinPhiCompensation *
        (compensationSegmentLength + compensationLengthChange);
    const constant =
      -sinPhiCompensation *
      (compensationSegmentLength + compensationLengthChange / 2);

    const isInUnitRange = (value: number) =>
      value >= -EPSILON && value <= 1 + EPSILON;
    const u =
      Math.abs(quadratic) < EPSILON
        ? Math.abs(linear) < EPSILON
          ? undefined
          : -constant / linear
        : (() => {
            const discriminant = linear * linear - 4 * quadratic * constant;
            if (discriminant < 0) return;
            const root = Math.sqrt(discriminant);
            return [
              (-linear + root) / (2 * quadratic),
              (-linear - root) / (2 * quadratic),
            ].find(isInUnitRange);
          })();
    if (u === undefined || !Number.isFinite(u) || !isInUnitRange(u)) return;

    const s = startS + u * (targetS - startS);

    if (s < -EPSILON || s > 1 + EPSILON) return;

    const meetingPoint = sharedStart.plus(sharedVector.times(s)).toPoint();

    // Now find the new positions for the non-shared endpoints.
    // These must result in edges that are parallel to the original ones.
    const movingEdgeContraction = new Line(meetingPoint, contractionEdgeAngle);
    const movingEdgeCompensation = new Line(
      meetingPoint,
      compensationEdgeAngle,
    );

    const newContractionPoint =
      movingEdgeContraction.intersectsLine(contractionTrack);
    const newCompensationPoint =
      movingEdgeCompensation.intersectsLine(compensationTrack);

    if (!newContractionPoint || !newCompensationPoint) return;

    return {
      s,
      meetingPoint,
      newContractionPoint,
      newCompensationPoint,
    };
  }

  /**
   * Get all edges of the configurations involved in the edge move (contraction and compensation).
   * @returns An array of {@link HalfEdge}s.
   */
  get x1x2() {
    const x1x2 = this.contraction.configuration.x;
    if (this.compensation) x1x2.push(...this.compensation.configuration.x);
    return x1x2;
  }

  /**
   * Perform the edge move.
   * @param dcel The {@link Dcel} to perform the edge move on.
   * @param contractions A map of edge IDs to their corresponding {@link Contraction}s.
   * @param configurations A map of edge IDs to their corresponding {@link Configuration}s.
   * @returns An object containing the updated {@link Dcel}, contractions, and configurations.
   */
  doEdgeMove(
    dcel: Dcel,
    // This contains all contractions no only the ones of the pair, hence, not all of them are complementary or feasible (undefined contractions)
    contractions: Map<
      string,
      {
        [ContractionType.P]: Contraction | undefined;
        [ContractionType.N]: Contraction | undefined;
      }
    >,
    configurations: Map<string, Configuration>,
  ) {
    // Check if edge references are still valid in the current DCEL.

    const configContractionEdge = this.contraction.configuration.innerEdge;
    const configCompensationEdge = this.compensation.configuration.innerEdge;

    const contractionEdge = configContractionEdge.coordKey
      ? dcel
          .getHalfEdges()
          .find((e) => e.coordKey === configContractionEdge.coordKey)
      : undefined;
    const compensationEdge = configCompensationEdge.coordKey
      ? dcel
          .getHalfEdges()
          .find((e) => e.coordKey === configCompensationEdge.coordKey)
      : undefined;

    if (!contractionEdge || !compensationEdge) return;

    // Store edges involved in the edge move before any coordinate changes.
    // This is the complete list of edges from both configurations that are involved in the move.
    // We capture it now while coordKey lookups are still reliable.
    const x1x2Edges = [...this.x1x2];

    // Capture edge set before the move to track which edges will be deleted
    const edgesBeforeMove = new Set(dcel.getHalfEdges());

    const contractionHead = contractionEdge.head;

    if (!contractionHead) return;

    // 1. Update (decrement) blocking edges using the stored x1x2 references
    contractions.forEach((contractions) => {
      Object.values(contractions).forEach((d) =>
        d?.decrementBlockingNumber(x1x2Edges, configurations),
      );
    });

    // Perform the appropriate variant of the edge move
    const movedPositions = this.shouldUseSharedEdgeMove()
      ? this.doSharedEdgeMove(contractionEdge, compensationEdge)
      : this.doRegularEdgeMove(contractionEdge, compensationEdge);

    if (!movedPositions) return;

    const remainingEdges = movedPositions.reduce(
      (acc: HalfEdge[], pos: Point) => {
        const vertex = dcel.findVertex(pos.x, pos.y);
        if (!vertex) return acc;
        vertex.edges.forEach((edge) => {
          if (edge.face === contractionEdge.face) acc.push(edge);
          else if (edge.twin) acc.push(edge.twin);
        });
        return acc;
      },
      [],
    );

    // 2.4 Update the affected configurations
    this.updateConfigurations(remainingEdges, configurations);

    // 3. Update (increment) blocking numbers again using the stored x1x2 references
    contractions.forEach((contraction) => {
      Object.values(contraction).forEach((d) =>
        d?.incrementBlockingNumber(x1x2Edges, configurations),
      );
    });

    // Remove any collinear vertices created by the edge move
    // Collect all vertices incident to edges that were affected by the move
    const affectedVertices = remainingEdges.reduce(
      (vertices: Set<number>, edge) => {
        if (typeof edge.tail.id === "number") vertices.add(edge.tail.id);
        if (edge.head && typeof edge.head.id === "number")
          vertices.add(edge.head.id);
        // Also check neighbors of affected vertices
        edge.tail.edges.forEach((e) => {
          if (e.head && typeof e.head.id === "number") vertices.add(e.head.id);
        });
        if (edge.head) {
          edge.head.edges.forEach((e) => {
            if (e.head && typeof e.head.id === "number")
              vertices.add(e.head.id);
          });
        }
        return vertices;
      },
      new Set<number>(),
    );

    // Remove collinear vertices, repeating until no more are found
    // (removing one might make others collinear)
    let foundCollinear = true;
    while (foundCollinear) {
      foundCollinear = false;
      affectedVertices.forEach((vertexId: number) => {
        const vertex = dcel.vertices.get(vertexId);
        if (vertex && isCollinearVertex(vertex)) {
          vertex.remove();
          foundCollinear = true;
        }
      });
    }

    //TO-DO: also update face-face-boundary-list
    // Comprehensive configuration update after edge moves and collinear removal.
    // We must:
    // 1. Remove configurations for edges that were deleted during the move or collinear removal
    // 2. Add configurations for new edges that were created
    // 3. Reinitialize adjacent configurations whose outer edges changed
    const edgesAfterMove = new Set(dcel.getHalfEdges());

    // Find edges that were deleted
    const deletedEdges = new Set<HalfEdge>();
    edgesBeforeMove.forEach((edge) => {
      if (!edgesAfterMove.has(edge)) {
        deletedEdges.add(edge);
      }
    });

    // Find edges that were created
    const newEdges: HalfEdge[] = [];
    edgesAfterMove.forEach((edge) => {
      if (!edgesBeforeMove.has(edge)) {
        newEdges.push(edge);
      }
    });

    // A contraction takes an edge with it, so the move leaves the Dcel with fewer
    // than it found — unless it left a copy of a junction behind, which adds one of
    // its own and can make up the difference.
    const leftCopyBehind = [this.contraction, this.compensation].some(
      ({ copiesLeft }) => copiesLeft.length > 0,
    );
    if (edgesAfterMove.size >= edgesBeforeMove.size && !leftCopyBehind)
      throw new Error(
        "Edge move left the Dcel with no fewer edges than it found",
      );

    // Remove configurations whose edge the move has taken away. Comparing against
    // what the Dcel holds rather than against what the move deleted also reaches an
    // edge which came and went within the move, as a junction left behind can leave.
    const staleCofigurationKeys = configurations
      .entries()
      .flatMap(([key, config]) =>
        edgesAfterMove.has(config.innerEdge) ? [] : [key],
      );
    staleCofigurationKeys.forEach((key) => configurations.delete(key));

    // Add configurations for new edges
    newEdges.forEach((edge) => {
      if (
        edge.endpoints.every((vertex) => vertex.degree <= 3) &&
        edge.coordKey
      ) {
        const newConfiguration = new Configuration(edge);
        newConfiguration.initialize(configurations);
        configurations.set(edge.coordKey, newConfiguration);
      }
    });

    // A junction left behind rearranges the edges around itself and around the vertex
    // it was left on, so those count among the edges the move touched.
    [this.contraction, this.compensation].forEach(({ copiesLeft }) =>
      copiesLeft.forEach((vertex) =>
        vertex.edges.forEach((edge) => remainingEdges.push(edge)),
      ),
    );

    // Reinitialize configurations whose outer edges were affected by the move.
    // When outer edges change, contraction areas may change, so we need to recalculate them.
    // Check all remaining edges' adjacent configurations (prev/next edges affect their outer edges)
    const adjacentConfigsToReinit = remainingEdges.reduce<Set<Configuration>>(
      (configs, edge) => {
        // Check edges in the cycle around this edge
        const walkEdge = (
          e: HalfEdge | undefined,
          visited: Set<HalfEdge> = new Set(),
        ) => {
          if (!e || visited.has(e)) return;
          visited.add(e);

          const config = configurations.get(e.coordKey ?? "");
          if (config) {
            configs.add(config);
          }

          // Walk in a limited chain (3-4 edges) to find nearby configurations
          if (visited.size < 4) {
            walkEdge(e.prev, visited);
            walkEdge(e.next, visited);
          }
        };

        walkEdge(edge);
        if (edge.twin) walkEdge(edge.twin);
        return configs;
      },
      new Set<Configuration>(),
    );

    // Reinitialize the contractions for affected configurations
    adjacentConfigsToReinit.forEach((config) =>
      config.initialize(configurations),
    );

    return { dcel, contractions, configurations };
  }

  /**
   * Perform the edge move when the contraction and compensation share an outer edge.
   * Both edges move proportionally based on the area change they cause, converging towards a meeting point where area change is balanced.
   * @param contractionEdge An edge reference from the DCEL.
   * @param compensationEdge An edge reference from the DCEL.
   * @returns An array of {@link Point}s representing the positions of the moved edges, which can be used to update the configurations.
   * Returns void if the edge move could not be performed due to incomplete DCEL links.
   */
  doSharedEdgeMove(contractionEdge: HalfEdge, compensationEdge: HalfEdge) {
    const meeting = this.getMeetingPoint();

    if (!meeting) return;

    const { meetingPoint, newContractionPoint, newCompensationPoint } = meeting;

    // Assign to head/tail based on which endpoint was on shared edge
    let newContractionHead: Point;
    let newContractionTail: Point;

    if (this.hasHeadOnSharedEdge(ConfigurationPurpose.CONTRACTION)) {
      newContractionHead = meetingPoint;
      newContractionTail = newContractionPoint;
    } else {
      newContractionTail = meetingPoint;
      newContractionHead = newContractionPoint;
    }

    let newCompensationHead: Point;
    let newCompensationTail: Point;

    if (this.hasHeadOnSharedEdge(ConfigurationPurpose.COMPENSATION)) {
      newCompensationHead = meetingPoint;
      newCompensationTail = newCompensationPoint;
    } else {
      newCompensationTail = meetingPoint;
      newCompensationHead = newCompensationPoint;
    }

    // A junction either inner edge meets is left behind before the move, so that its
    // other edges keep the vertex they have rather than being dragged along.
    this.contraction.leaveJunctionsBehind(
      newContractionTail,
      newContractionHead,
    );
    this.compensation.leaveJunctionsBehind(
      newCompensationTail,
      newCompensationHead,
    );

    // Perform the actual edge moves using moveTo
    contractionEdge.moveTo(newContractionTail, newContractionHead);
    compensationEdge.moveTo(newCompensationTail, newCompensationHead);

    // Return moved positions for configuration updates
    return [
      newContractionTail,
      newContractionHead,
      newCompensationTail,
      newCompensationHead,
    ];
  }

  /**
   * Calculate the new positions for the compensation edge after the contraction edge has moved.
   * The compensation edge is shifted parallel to its original position.
   * @returns An array containing the new tail and head points for the compensation edge, or undefined if the calculation fails.
   */
  getNewCompensationPositions() {
    const compensationEdge = this.compensation.configuration.innerEdge;
    const [prevTrack, nextTrack] = this.compensation.configuration.getTracks(
      this.compensation.type,
    );
    if (!prevTrack || !nextTrack) return;

    const compensationHeight = this.compensation.getCompensationHeight(
      this.contraction.area,
    );
    if (compensationHeight === undefined) return;

    // Calculate the shifted inner edge line (parallel to the original inner edge)
    const edgeVector = compensationEdge.getVector();
    const unitEdgeVector = edgeVector?.unitVector;
    const normal = unitEdgeVector
      ?.getNormal(this.compensation?.type === ContractionType.N)
      .times(compensationHeight);
    if (!normal) return;

    // Shift one point on the inner edge to define the new parallel line
    const originalTail = compensationEdge.tail.vector;
    const shiftedPoint = originalTail.plus(normal).toPoint();
    const innerEdgeDirection = compensationEdge.getVector()?.unitVector;
    if (!innerEdgeDirection) return;

    // Create the shifted inner edge as an (infinite) line
    const shiftedInnerEdgeLine = new Line(
      shiftedPoint,
      innerEdgeDirection.angle,
    );

    const newTail = shiftedInnerEdgeLine.intersectsLine(prevTrack);
    const newHead = shiftedInnerEdgeLine.intersectsLine(nextTrack);

    return [newTail, newHead];
  }

  /**
   * Perform the edge move when the contraction and compensation do not share an outer edge.
   * This is the regular case, where the contraction and compensation can be performed independently.
   * @param contractionEdge An edge reference from the DCEL.
   * @param compensationEdge An edge reference from the DCEL.
   * @returns An array of {@link Point}s representing the positions of the moved edges, which can be used to update the configurations.
   * Returns void if the edge move could not be performed due to incomplete DCEL links.
   */
  doRegularEdgeMove(contractionEdge: HalfEdge, compensationEdge: HalfEdge) {
    // 1 Get references
    const contractionArea = this.contraction.area;

    const compensationLength = compensationEdge.toLineSegment()?.length;
    const compensationEdgeLine = compensationEdge.toLine();
    if (!compensationLength || !compensationEdgeLine) return;

    // 2 Calculate compensation trapeze height
    const compensationHeight =
      this.compensation.getCompensationHeight(contractionArea);
    if (compensationHeight === undefined) return;

    // 3 Calculate new positions for compensation edge
    const endpoints = this.getNewCompensationPositions();
    if (!endpoints) return;
    const [newTail, newHead] = endpoints;
    if (!newTail || !newHead) return;

    // 4 Do the contraction and the compensation
    const prevEdgeLineSegment = contractionEdge.prev?.toLineSegment();
    const nextEdgeLineSegment = contractionEdge.next?.toLineSegment();
    if (!prevEdgeLineSegment || !nextEdgeLineSegment) return;

    const pointA = this.contraction.point;
    const pointB = this.contraction.areaPoints.at(-1);
    if (!pointA || !pointB) return;

    // With only three area points the configuration's two tracks meet in the
    // contraction point, which leaves no inner edge: both of its endpoints arrive
    // there and the edge collapses, rather than coming to rest on a track. Sending
    // them anywhere else lays the inner edge on top of one of the outer edges.
    const innerEdgeVanishes = this.contraction.areaPoints.length === 3;
    const [newContractionTail, newContractionHead] = innerEdgeVanishes
      ? [pointA, pointA]
      : pointA.isOnLineSegment(prevEdgeLineSegment)
        ? [pointA, pointB]
        : [pointB, pointA];
    // A junction the inner edge meets is left behind before the move, so that its
    // other edges keep the vertex they have rather than being dragged along.
    this.contraction.leaveJunctionsBehind(
      newContractionTail,
      newContractionHead,
    );
    const contractionAfterMove = innerEdgeVanishes
      ? contractionEdge.moveTo(pointA, pointA)
      : pointA.isOnLineSegment(prevEdgeLineSegment)
        ? contractionEdge.moveTo(pointA, pointB)
        : contractionEdge.moveTo(pointB, pointA);

    // From here on the Dcel carries the contraction, so giving up would leave the
    // edge move half done. What the two moves may still run into is reported rather
    // than returned, since the caller can no longer treat it as a move not taken.
    const movedPositions: Point[] = [];
    if (contractionAfterMove) {
      const contractionHead = contractionAfterMove.head;
      if (!contractionHead)
        throw new Error(
          "Edge move left the contraction edge without a head, after moving it",
        );
      movedPositions.push(
        contractionAfterMove.tail.toPoint(),
        contractionHead.toPoint(),
      );
    } else {
      // The collapsed edge left both of its endpoints merged into this one vertex.
      movedPositions.push(pointA);
    }

    this.compensation.leaveJunctionsBehind(newTail, newHead);
    const compensationAfterMove = compensationEdge.moveTo(newTail, newHead);

    if (!compensationAfterMove) {
      // Both of the compensation's tracks meeting at the height it moves by collapses
      // its inner edge, which is a legitimate outcome. Collapsing anywhere else means
      // the contraction has invalidated the positions this move was derived from.
      if (newTail.distanceToPoint(newHead) > EPSILON)
        throw new Error(
          "Edge move collapsed the compensation edge, whose endpoints lie " +
            newTail.distanceToPoint(newHead) +
            " apart, after the contraction was applied",
        );
      movedPositions.push(newTail);
      return movedPositions;
    }

    movedPositions.push(compensationAfterMove.tail.toPoint());
    const compensationHead = compensationAfterMove.head?.toPoint();
    if (compensationHead) movedPositions.push(compensationHead);

    return movedPositions;
  }

  /**
   * Checks if the contraction and compensation share one of the same outer edges
   * This is a special case that requires a different handling in the edge move.
   * @returns A boolean indicating whether the configurations share an outer edge.
   */
  isSharingEdge(): boolean {
    return this.findSharedOuterEdge() !== undefined;
  }

  /**
   * Determines whether performing the two moves one after the other would consume
   * the shared outer edge past its own length.
   *
   * Both inner edges keep one endpoint on the shared edge's track, so each move slides
   * that endpoint along the track. Sliding towards the other endpoint shortens the shared
   * edge, sliding away lengthens it. The moves over-consume the shared edge exactly when
   * the two landing points swap places (or meet), which is what makes them inseparable.
   * @param shared The outer {@link HalfEdge} both configurations have in common.
   * @returns A boolean indicating whether the shared edge is consumed past collapse.
   */
  private consumesSharedEdge(shared: HalfEdge): boolean {
    const sharedSegment = shared.toLineSegment();
    const sharedDirection = shared.getVector()?.unitVector;
    const sharedLine = shared.toLine();
    if (!sharedSegment || !sharedDirection || !sharedLine) return false;

    const origin = sharedSegment.endPoint1.vector;
    const offset = ({ vector }: { vector: Vector2D }) =>
      vector.minus(origin).dot(sharedDirection);

    const travel = [
      ConfigurationPurpose.CONTRACTION,
      ConfigurationPurpose.COMPENSATION,
    ].map((purpose) => {
      const start = this.getSharedEndpoint(purpose, shared);
      const landing = this.getSharedLanding(purpose, sharedLine);
      return start && landing
        ? { start: offset(start), landing: offset(landing) }
        : undefined;
    });
    const [contraction, compensation] = travel;
    if (!contraction || !compensation) return false;

    const before = compensation.start - contraction.start;
    const after = compensation.landing - contraction.landing;

    return after * Math.sign(before) <= EPSILON;
  }

  /**
   * Gets the endpoint the given configuration's inner edge has in common with the shared outer edge.
   * @param purpose Which configuration of the pair to look at.
   * @param shared The shared outer {@link HalfEdge}.
   * @returns The common {@link Vertex}, or undefined if the inner edge does not touch the shared edge.
   */
  private getSharedEndpoint(purpose: ConfigurationPurpose, shared: HalfEdge) {
    const innerEdge = this.getConfiguration(purpose).configuration.innerEdge;
    const sharedEndpoints = shared.endpoints;
    if (!sharedEndpoints) return;
    return innerEdge.endpoints.find((vertex) =>
      sharedEndpoints.some((endpoint) => endpoint.equals(vertex)),
    );
  }

  /**
   * Gets where the given configuration's inner edge endpoint lands on the shared edge's
   * track once that configuration has performed its (regular, uncoupled) move.
   * @param purpose Which configuration of the pair to look at.
   * @param sharedLine The {@link Line} through the shared outer edge.
   * @returns The landing {@link Point}, or undefined if it cannot be derived.
   */
  private getSharedLanding(purpose: ConfigurationPurpose, sharedLine: Line) {
    const candidates =
      purpose === ConfigurationPurpose.CONTRACTION
        ? [this.contraction.point, this.contraction.areaPoints.at(-1)]
        : this.getNewCompensationPositions();
    return candidates
      ?.filter((point): point is Point => !!point)
      .find(
        (point) =>
          Math.abs(sharedLine.perpendicularDistanceToPoint(point)) < EPSILON,
      );
  }

  /**
   * Determines whether to use shared edge move logic.
   * Shared edge move should only be used if:
   * 1. The configurations share an outer edge
   * 2. The contraction or the compensation point lies on that shared edge (including endpoints)
   * @returns A boolean indicating whether shared edge move logic should be used.
   */
  shouldUseSharedEdgeMove(): boolean {
    const sharedEdge = this.findSharedOuterEdge();
    if (!sharedEdge) return false;

    // Case A: the CONTRACTION itself collapses the shared edge.
    // getPoint's winning candidate is the vanishing edge — if that edge IS the
    // shared edge, the two moves are inherently coupled.
    const point = Contraction.getPoint(
      this.contraction.configuration,
      this.contraction.type,
    );
    const { vanishing } = point ?? {};
    const vanishingEdge =
      vanishing === OuterEdge.NEXT
        ? this.contraction.configuration.innerEdge.next
        : vanishing === OuterEdge.PREV
          ? this.contraction.configuration.innerEdge.prev
          : this.contraction.configuration.innerEdge;
    const ve = vanishingEdge?.endpoints;
    const se = sharedEdge.endpoints;
    if (
      ve &&
      se &&
      ((ve[0].equals(se[0]) && ve[1].equals(se[1])) ||
        (ve[0].equals(se[1]) && ve[1].equals(se[0])))
    )
      return true;

    // Case B: contraction completes on a NON-shared edge (your C2 case, where
    // contraction.point is not on the shared edge). Then check whether the
    // COMPENSATION's partial travel (getCompensationHeight — NOT compensation.point)
    // would consume the shared edge past collapse before the contraction finishes.
    return this.consumesSharedEdge(sharedEdge);
  }

  /**
   * Finds a shared outer edge between the contraction and compensation configurations.
   * @returns The shared {@link HalfEdge}, or undefined if no outer edge is shared.
   */
  private findSharedOuterEdge(): HalfEdge | undefined {
    const contractionOuterEdges =
      this.contraction.configuration.getOuterEdges();
    const compensationOuterEdges =
      this.compensation.configuration.getOuterEdges();

    return contractionOuterEdges.find((conEdge) =>
      compensationOuterEdges.some(
        (compEdge) => conEdge.coordKey === compEdge.coordKey,
      ),
    );
  }

  /**
   * Update the configuration of the in the edge move involved HalfEdges.
   * @param involvedEdges An array of {@link HalfEdge}s which are left from the {@link ConfigurationPair}.
   * @returns void, if the {@link Dcel}'s links are not complete.
   */
  updateConfigurations(
    involvedEdges: HalfEdge[],
    configurations: Map<string, Configuration>,
  ) {
    involvedEdges.forEach((edge) => {
      if (!edge) return;
      if (
        edge.endpoints.every((vertex) => vertex.degree <= 3) &&
        edge.coordKey
      ) {
        const newConfiguration = new Configuration(edge);
        newConfiguration.initialize(configurations);
        configurations.set(edge.coordKey, newConfiguration);
      }
    });
  }
}

export default ConfigurationPair;
