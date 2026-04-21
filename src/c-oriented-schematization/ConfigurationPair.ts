import Dcel from "../Dcel/Dcel";
import HalfEdge from "../Dcel/HalfEdge";
import { EPSILON } from "../geometry/contstants";
import Point from "../geometry/Point";
import Vector2D from "../geometry/Vector2D";
import Configuration from "./Configuration";
import Contraction from "./Contraction";
import { ContractionType } from "./ContractionType";
import { isCollinearVertex } from "./VertexUtils";

/**
 * A pair of {@link Contraction}s, which are complementary and non-conflicting.
 * The {@link ConfigurationPair} is used to perform an edge move.
 */
class ConfigurationPair {
  contraction: Contraction;
  compensation: Contraction;

  constructor(contraction: Contraction, compensation: Contraction) {
    this.contraction = contraction;
    this.compensation = compensation;
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

    // Remove configurations for deleted edges
    const staleCofigurationKeys = configurations
      .entries()
      .flatMap(([key, config]) =>
        deletedEdges.has(config.innerEdge) ? [key] : [],
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
    const contractionHead = contractionEdge.head;

    if (!contractionHead) return;

    // Get the shared outer edge
    const sharedEdge = this.findSharedOuterEdge();
    if (!sharedEdge) return;

    //Get track lines from outer edges - these constrain movement endpoints
    const contractionTracks = this.contraction.configuration.tracks;
    const compensationTracks = this.compensation.configuration.tracks;

    // Get edge segments for length calculations
    const contractionSegment = contractionEdge.toLineSegment();
    if (!contractionSegment) return;

    const compensationSegment = compensationEdge.toLineSegment();
    if (!compensationSegment) return;

    // Find meeting point using constraint that edge angle is constant
    // Constraints:
    // 1. Shared endpoint A moves along shared edge: A = shared_start + s * shared_vector
    // 2. Non-shared endpoint B moves along track: B = track_start + t * track_vector
    // 3. Edge vector (A - B) must be parallel to original edge (angle is constant)
    // 4. Area preservation: length × movement_distance × sin(angle) is balanced
    const sharedSegment = sharedEdge.toLineSegment();
    if (!sharedSegment) return;

    const sharedVector = sharedSegment.endPoint2.vector.minus(
      sharedSegment.endPoint1.vector,
    );
    const sharedStart = sharedSegment.endPoint1.vector;

    // Determine which endpoint is on shared edge vs track
    const sharedEdgeTail = sharedEdge.tail;
    const sharedEdgeHead = sharedEdge.head;

    // Compare by coordinates, not by object reference
    const contractionHeadOnShared =
      (contractionHead.xy[0] === sharedEdgeTail.xy[0] &&
        contractionHead.xy[1] === sharedEdgeTail.xy[1]) ||
      (sharedEdgeHead &&
        contractionHead.xy[0] === sharedEdgeHead.xy[0] &&
        contractionHead.xy[1] === sharedEdgeHead.xy[1]);
    const compensationHeadOnShared =
      (compensationEdge.head?.xy[0] === sharedEdgeTail.xy[0] &&
        compensationEdge.head?.xy[1] === sharedEdgeTail.xy[1]) ||
      (sharedEdgeHead &&
        compensationEdge.head &&
        compensationEdge.head.xy[0] === sharedEdgeHead.xy[0] &&
        compensationEdge.head.xy[1] === sharedEdgeHead.xy[1]);

    const contractionTrack = contractionTracks[contractionHeadOnShared ? 1 : 0];
    const compensationTrack =
      compensationTracks[compensationHeadOnShared ? 1 : 0];

    if (!contractionTrack || !compensationTrack) return;

    const contractionTrackVec = new Vector2D(
      Math.cos(contractionTrack.angle),
      Math.sin(contractionTrack.angle),
    );
    const compensationTrackVec = new Vector2D(
      Math.cos(compensationTrack.angle),
      Math.sin(compensationTrack.angle),
    );

    const contractionEdgeAngle = contractionEdge.getAngle();
    const compensationEdgeAngle = compensationEdge.getAngle();
    if (
      typeof contractionEdgeAngle !== "number" ||
      typeof compensationEdgeAngle !== "number"
    )
      return;

    // Original edge direction vectors (unit)
    const contractionEdgeDir = new Vector2D(
      Math.cos(contractionEdgeAngle),
      Math.sin(contractionEdgeAngle),
    );
    const compensationEdgeDir = new Vector2D(
      Math.cos(compensationEdgeAngle),
      Math.sin(compensationEdgeAngle),
    );

    // Get starting positions for non-shared endpoints
    const contractionNonSharedStart = contractionHeadOnShared
      ? contractionEdge.tail.vector
      : contractionHead.vector;

    if (!compensationEdge.head) return; // Head should exist for a valid edge

    const compensationNonSharedStart = compensationHeadOnShared
      ? compensationEdge.tail.vector
      : compensationEdge.head.vector;

    const contractionOffset = sharedStart.minus(contractionNonSharedStart);
    const contractionA = sharedVector.cross(contractionEdgeDir); // coefficient of s
    const contractionB = contractionTrackVec.cross(contractionEdgeDir); // coefficient of t_c
    const contractionC = contractionOffset.cross(contractionEdgeDir); // constant

    const compensationOffset = sharedStart.minus(compensationNonSharedStart);
    const compensationA = sharedVector.cross(compensationEdgeDir);
    const compensationB = compensationTrackVec.cross(compensationEdgeDir);
    const compensationC = compensationOffset.cross(compensationEdgeDir);

    // Both edges have angle preservation constraints:
    // contractionA * s - contractionB * t_c = -contractionC
    // compensationA * s - compensationB * t_comp = -compensationC
    //
    // Additionally, area preservation links t_c and t_comp:
    // For proportional area change: length_c * t_c = -length_comp * t_comp
    // This gives: t_comp = -(length_c / length_comp) * t_c

    const contractionLength = contractionSegment.length;
    const compensationLength = compensationSegment.length;

    if (contractionLength === 0 || compensationLength === 0) return;

    // Area preservation coefficient
    const areaPreservationCoeff = contractionLength / compensationLength;

    // Now solve the coupled system:
    // From constraint (1): t_c = (contractionA * s + contractionC) / contractionB
    // From area preservation: t_comp = -areaPreservationCoeff * t_c
    //
    // Substitute into constraint (2):
    // compensationA * s - compensationB * (-areaPreservationCoeff * (contractionA * s + contractionC) / contractionB) = -compensationC
    // Rearrange:
    // compensationA * s + (compensationB * areaPreservationCoeff * contractionA / contractionB) * s + (compensationB * areaPreservationCoeff * contractionC / contractionB) = -compensationC
    // (compensationA + compensationB * areaPreservationCoeff * contractionA / contractionB) * s = -compensationC - (compensationB * areaPreservationCoeff * contractionC / contractionB)

    // Simplified: solve the linear system for s
    // coeff_s * s = const_term
    const coeff_s =
      compensationA +
      (compensationB * areaPreservationCoeff * contractionA) / contractionB;
    const const_term =
      -compensationC -
      (compensationB * areaPreservationCoeff * contractionC) / contractionB;

    let s = 0;
    if (Math.abs(coeff_s) > EPSILON) {
      s = const_term / coeff_s;
    }

    let t_contraction = 0;
    let t_compensation = 0;

    // Solve for t values
    if (Math.abs(contractionB) > EPSILON) {
      t_contraction = (contractionA * s + contractionC) / contractionB;
    }
    // Apply area preservation
    t_compensation = -areaPreservationCoeff * t_contraction;

    const meetingPoint = sharedStart.plus(sharedVector.times(s)).toPoint();
    // Move along the track by the calculated distances (allow negative movement)
    const newContractionNonShared = contractionNonSharedStart
      .plus(contractionTrackVec.times(t_contraction))
      .toPoint();
    const newCompensationNonShared = compensationNonSharedStart
      .plus(compensationTrackVec.times(t_compensation))
      .toPoint();

    // Assign to head/tail based on which endpoint was on shared edge
    let newContractionHead: Point;
    let newContractionTail: Point;

    if (contractionHeadOnShared) {
      newContractionHead = meetingPoint;
      newContractionTail = newContractionNonShared;
    } else {
      newContractionTail = meetingPoint;
      newContractionHead = newContractionNonShared;
    }

    let newCompensationHead: Point;
    let newCompensationTail: Point;

    if (compensationHeadOnShared) {
      newCompensationHead = meetingPoint;
      newCompensationTail = newCompensationNonShared;
    } else {
      newCompensationTail = meetingPoint;
      newCompensationHead = newCompensationNonShared;
    }

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
   * Perform the edge move when the contraction and compensation do not share an outer edge.
   * This is the regular case, where the contraction and compensation can be performed independently.
   * @param contractionEdge An edge reference from the DCEL.
   * @param compensationEdge An edge reference from the DCEL.
   * @returns An array of {@link Point}s representing the positions of the moved edges, which can be used to update the configurations.
   * Returns void if the edge move could not be performed due to incomplete DCEL links.
   */
  doRegularEdgeMove(contractionEdge: HalfEdge, compensationEdge: HalfEdge) {
    const contractionHead = contractionEdge.head;
    if (!contractionHead) return;

    // 2.1 Calculate new positions for contraction edge
    const pointA = this.contraction.point;
    const pointB = this.contraction.areaPoints.at(-1);
    if (!pointA || !pointB) return;
    const contractionSegment = contractionEdge.toLineSegment();
    if (!contractionSegment) return;

    // 2.2 Calculate compensation trapeze height
    const compensationShift = this.compensationShift;
    if (!compensationShift) return;

    // 2.3 Calculate new positions for compensation edge
    const normal = compensationEdge
      .getVector()
      ?.unitVector.getNormal(this.compensation?.type === ContractionType.N)
      .times(compensationShift);
    if (!normal) return;

    const newTail = compensationEdge.tail.vector.plus(normal).toPoint();
    const newHead = compensationEdge.head?.vector.plus(normal).toPoint();
    if (!newHead) return;

    // 2.4 Do the contraction and the compensation
    const prevEdgeLineSegment = contractionEdge.prev?.toLineSegment();
    const nextEdgeLineSegment = contractionEdge.next?.toLineSegment();
    if (!prevEdgeLineSegment || !nextEdgeLineSegment) return;

    if (pointA.isOnLineSegment(prevEdgeLineSegment)) {
      contractionEdge.moveTo(pointA, pointB);
    } else {
      contractionEdge.moveTo(pointB, pointA);
    }

    const movedPositions = [
      contractionEdge.tail.toPoint(),
      contractionHead.toPoint(),
    ];

    const compensationAfterMove = compensationEdge.moveTo(newTail, newHead);

    // If compensation edge became degenerate, we can't continue
    if (!compensationAfterMove) return;

    movedPositions.push(compensationAfterMove.tail.toPoint());
    const compensationHead = compensationAfterMove.head?.toPoint();
    if (compensationHead) movedPositions.push(compensationHead);

    return movedPositions;
  }

  get compensationShift() {
    return this.compensation.getCompensationHeight(this.contraction.area);
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
   * Determines whether to use shared edge move logic.
   * Shared edge move should only be used if:
   * 1. The configurations share an outer edge
   * 2. The contraction or the compensation point lies on that shared edge (including endpoints)
   * @returns A boolean indicating whether shared edge move logic should be used.
   */
  shouldUseSharedEdgeMove(): boolean {
    if (!this.isSharingEdge()) return false;

    const sharedEdge = this.findSharedOuterEdge();
    const sharedSegment = sharedEdge?.toLineSegment();
    const contractionPoint = this.contraction.point;
    const compensationPoint = this.compensation.point;

    return !!(
      sharedSegment &&
      contractionPoint &&
      compensationPoint &&
      (contractionPoint.isOnLineSegment(sharedSegment) ||
        compensationPoint.isOnLineSegment(sharedSegment))
    );
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
