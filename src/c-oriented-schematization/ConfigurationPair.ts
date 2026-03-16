import Contraction from "./Contraction";
import { ContractionType } from "./ContractionType";
import Configuration from "./Configuration";
import HalfEdge from "../Dcel/HalfEdge";
import Point from "../geometry/Point";
import Dcel from "../Dcel/Dcel";
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
    // this contains all contractions no only the ones of the pair, hence, not all of them are complementary or feasible (undefined contractions)
    contractions: Map<
      string,
      {
        [ContractionType.P]: Contraction | undefined;
        [ContractionType.N]: Contraction | undefined;
      }
    >,
    configurations: Map<string, Configuration>,
  ) {
    // Fetch fresh edge references from DCEL using coordKey, not stale object references
    // This ensures we're working with edges that are actually in the current DCEL
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

    const contractionHead = contractionEdge.head;

    if (!contractionHead) return;

    // 1. Update (decrement) blocking edges
    contractions.forEach((contractions) => {
      Object.values(contractions).forEach((d) =>
        d?.decrementBlockingNumber(this.x1x2, configurations),
      );
    });

    // Perform the appropriate variant of the edge move
    const movedPositions = this.isSharingEdge()
      ? this.doSharedEdgeMove(configurations)
      : this.doRegularEdgeMove(configurations);

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

    // TODO: 3. Update (increment) blocking numbers again
    contractions.forEach((contraction) => {
      Object.values(contraction).forEach((d) =>
        d?.incrementBlockingNumber(this.x1x2, configurations),
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

    //TODO: update uuids of maps?
    return { dcel, contractions, configurations };
  }

  /**
   * Perform the edge move when the contraction and compensation share an outer edge.
   * Both edges move proportionally based on their areas, converging towards a meeting point where area change is balanced.
   * @returns An array of {@link Point}s representing the positions of the moved edges, which can be used to update the configurations.
   * Returns void if the edge move could not be performed due to incomplete DCEL links.
   */
  doSharedEdgeMove(configurations: Map<string, Configuration>) {
    const contractionEdge = this.contraction.configuration.innerEdge;
    const compensationEdge = this.compensation.configuration.innerEdge;
    const contractionHead = contractionEdge.head;

    if (!contractionHead) return;

    // Step 1: Get the shared outer edge
    const sharedEdge = this.findSharedOuterEdge();
    if (!sharedEdge) return;

    const contractionOuterEdges = this.contraction.configuration
      .getOuterEdges()
      .filter((e) => e.coordKey !== sharedEdge.coordKey);
    const compensationOuterEdges = this.compensation.configuration
      .getOuterEdges()
      .filter((e) => e.coordKey !== sharedEdge.coordKey);

    if (
      contractionOuterEdges.length === 0 ||
      compensationOuterEdges.length === 0
    )
      return;

    // Step 2: Get track lines from outer edges - these constrain movement endpoints
    const contractionTracks = this.contraction.configuration.tracks;
    const compensationTracks = this.compensation.configuration.tracks;

    if (contractionTracks.length === 0 || compensationTracks.length === 0)
      return;

    // Step 3: Calculate areas for proportional movement
    const contractionArea = this.contraction.area;

    if (!contractionArea) return;

    // Step 4: Calculate movement distances for both edges
    const contractionSegment = contractionEdge.toLineSegment();
    if (!contractionSegment) return;

    const compensationSegment = compensationEdge.toLineSegment();
    if (!compensationSegment) return;

    // In a shared edge move, both areas should be equal in magnitude (opposite signs)
    // Both edges will meet at a point on the shared edge proportional to their area ratio
    const compensationArea = contractionArea;

    // Step 5: Calculate the meeting point on the shared edge based on area ratios
    // Both edges should move to this point so they meet and the shared edge vanishes
    const sharedSegment = sharedEdge.toLineSegment();
    if (!sharedSegment) return;

    const totalArea = Math.abs(contractionArea) + Math.abs(compensationArea);
    const areaRatio = Math.abs(contractionArea) / totalArea;

    // The meeting point is on the shared edge, proportional to the area ratio
    const sharedVector = sharedSegment.endPoint2.vector.minus(
      sharedSegment.endPoint1.vector,
    );
    const meetingPoint = sharedSegment.endPoint1.vector
      .plus(sharedVector.times(areaRatio))
      .toPoint();

    // Step 5b: Both inner edges move to the meeting point on the shared edge
    // Determine which endpoint of each inner edge connects to the shared edge.
    // This depends on the orientation of the edges and can vary between iterations.

    const sharedEdgeTail = sharedEdge.tail;
    const sharedEdgeHead = sharedEdge.head;

    // Check which endpoint of contraction edge connects to shared edge
    const contractionHeadOnShared =
      contractionHead === sharedEdgeTail || contractionHead === sharedEdgeHead;
    const contractionTailOnShared =
      contractionEdge.tail === sharedEdgeTail ||
      contractionEdge.tail === sharedEdgeHead;

    // Check which endpoint of compensation edge connects to shared edge
    const compensationTailOnShared =
      compensationEdge.tail === sharedEdgeTail ||
      compensationEdge.tail === sharedEdgeHead;
    const compensationHeadOnShared =
      compensationEdge.head === sharedEdgeTail ||
      compensationEdge.head === sharedEdgeHead;

    // Determine the correct endpoints to move to meeting point
    let newContractionHead = meetingPoint;
    let newContractionTail = contractionEdge.tail.vector
      .plus(newContractionHead.vector.minus(contractionHead.vector))
      .toPoint();

    if (!contractionHeadOnShared && contractionTailOnShared) {
      // Tail is on shared edge, so move tail to meeting point
      newContractionTail = meetingPoint;
      newContractionHead = contractionHead.vector
        .plus(newContractionTail.vector.minus(contractionEdge.tail.vector))
        .toPoint();
    }

    if (!compensationEdge.head) return;

    let newCompensationTail = meetingPoint;
    let newCompensationHead = compensationEdge.head.vector
      .plus(newCompensationTail.vector.minus(compensationEdge.tail.vector))
      .toPoint();

    if (!compensationTailOnShared && compensationHeadOnShared) {
      // Head is on shared edge, so move head to meeting point
      newCompensationHead = meetingPoint;
      newCompensationTail = compensationEdge.tail.vector
        .plus(newCompensationHead.vector.minus(compensationEdge.head.vector))
        .toPoint();
    }

    // Step 7: Perform the actual edge moves using moveTo
    const prevEdgeLineSegment = contractionEdge.prev?.toLineSegment();
    const nextEdgeLineSegment = contractionEdge.next?.toLineSegment();
    if (!prevEdgeLineSegment || !nextEdgeLineSegment) return;

    // Determine which endpoint aligns with which adjacent edge
    const newContractionEdge = contractionEdge.moveTo(
      newContractionTail,
      newContractionHead,
    );

    if (newContractionEdge && newContractionEdge.coordKey) {
      const newConfiguration = new Configuration(newContractionEdge);
      newConfiguration.initialize(configurations);
      configurations.set(newContractionEdge.coordKey, newConfiguration);
    }

    const movedPositions: Point[] = [];

    movedPositions.push(contractionEdge.tail.toPoint());
    movedPositions.push(contractionHead.toPoint());

    const newCompensationEdge = compensationEdge.moveTo(
      newCompensationTail,
      newCompensationHead,
    );

    // If compensation edge became degenerate, we can't continue
    if (!newCompensationEdge) return;

    if (newCompensationEdge.coordKey) {
      const newConfiguration = new Configuration(newCompensationEdge);
      newConfiguration.initialize(configurations);
      configurations.set(newCompensationEdge.coordKey, newConfiguration);
    }

    movedPositions.push(newCompensationEdge.tail.toPoint());
    const newCompensationHeadPoint = newCompensationEdge.head?.toPoint();
    if (newCompensationHeadPoint) movedPositions.push(newCompensationHeadPoint);

    return movedPositions;
  }

  /**
   * Perform the edge move when the contraction and compensation do not share an outer edge.
   * This is the regular case, where the contraction and compensation can be performed independently.
   * @returns An array of {@link Point}s representing the positions of the moved edges, which can be used to update the configurations.
   * Returns void if the edge move could not be performed due to incomplete DCEL links.
   */
  doRegularEdgeMove(configurations: Map<string, Configuration>) {
    const contractionEdge = this.contraction.configuration.innerEdge;
    const compensationEdge = this.compensation.configuration.innerEdge;
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

    // 2.3 Do the contraction and the compensation
    const prevEdgeLineSegment = contractionEdge.prev?.toLineSegment();
    const nextEdgeLineSegment = contractionEdge.next?.toLineSegment();
    if (!prevEdgeLineSegment || !nextEdgeLineSegment) return;

    const newEdge = pointA.isOnLineSegment(prevEdgeLineSegment)
      ? contractionEdge.moveTo(pointA, pointB)
      : contractionEdge.moveTo(pointB, pointA);

    if (newEdge && newEdge.coordKey) {
      const newConfiguration = new Configuration(newEdge);
      newConfiguration.initialize(configurations);
      configurations.set(newEdge.coordKey, newConfiguration);
      // TODO: add newEdge to facefaceBoundaryList
      // newEdge?.dcel.faceFaceBoundaryList?.addEdge(newEdge);
    }

    const movedPositions: Point[] = [];

    movedPositions.push(contractionEdge.tail.toPoint());
    movedPositions.push(contractionHead.toPoint());

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
        edge.endpoints.every((vertex) => vertex.edges.length <= 3) &&
        edge.coordKey
      )
        configurations.set(edge.coordKey, new Configuration(edge));
    });
  }
}

export default ConfigurationPair;
