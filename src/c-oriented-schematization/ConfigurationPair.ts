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

    const movedPositions: Point[] = [];

    // 2.1 Calculate new positions for contraction edge
    const pointA = this.contraction.point;
    const pointB =
      this.contraction.areaPoints[this.contraction.areaPoints.length - 1];
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

    // Check whether one of new positions for the compensation edge are equal
    // to one of the original positions of the contraction edge
    if (
      [contractionEdge.tail, contractionHead].some(
        (point) => point.equals(newTail) || point.equals(newHead),
      )
    ) {
      this.doHalfEdgeMove();
      // Return the modified dcel (doHalfEdgeMove modifies in-place)
      return { dcel, contractions, configurations };
    }

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

    movedPositions.push(contractionEdge.tail.toPoint());
    movedPositions.push(contractionHead.toPoint());

    const compensationAfterMove = compensationEdge.moveTo(newTail, newHead);

    // If compensation edge became degenerate, we can't continue
    if (!compensationAfterMove) return;

    movedPositions.push(compensationAfterMove.tail.toPoint());
    const compensationHead = compensationAfterMove.head?.toPoint();
    if (compensationHead) movedPositions.push(compensationHead);

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

  get compensationShift() {
    return this.contraction.area > 0 && this.compensation
      ? this.compensation.getCompensationHeight(this.contraction.area)
      : undefined;
  }

  doHalfEdgeMove() {
    const contractionEdge = this.contraction.configuration.innerEdge;
    const compensationEdge = this.compensation.configuration.innerEdge;
    const compensationShift = this.compensationShift;
    if (!compensationShift) return;
    const normal = compensationEdge
      .getVector()
      ?.unitVector.getNormal(this.compensation?.type === ContractionType.N)
      .times(compensationShift / 2);
    if (!normal) return;
    const newTailComp = compensationEdge.tail.vector.plus(normal).toPoint();
    const newHeadComp = compensationEdge.head?.vector.plus(normal).toPoint();
    const newTailCon = contractionEdge.tail.vector.minus(normal).toPoint();
    const newHeadCon = contractionEdge.head?.vector.minus(normal).toPoint();

    if (newHeadCon) contractionEdge.moveTo(newTailCon, newHeadCon);
    if (newHeadComp) compensationEdge.moveTo(newTailComp, newHeadComp);
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
