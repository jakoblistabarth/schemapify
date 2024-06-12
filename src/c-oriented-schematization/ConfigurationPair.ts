import Contraction from "./Contraction";
import Configuration from "./Configuration";
import HalfEdge from "../Dcel/HalfEdge";
import Point from "../geometry/Point";
import { ContractionType } from "./ContractionType";
import Dcel from "../Dcel/Dcel";

/**
 * A pair of {@link Contraction}s, which are complementary and non-conflicting.
 * The {@link ConfigurationPair} is used to perform an edge move.
 */
class ConfigurationPair {
  contraction: Contraction;
  compensation?: Contraction;

  constructor(contraction: Contraction, compensation?: Contraction) {
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
   */
  doEdgeMove(
    dcel: Dcel,
    contractions: Map<
      string,
      { [ContractionType.P]?: Contraction; [ContractionType.N]?: Contraction }
    >,
    configurations: Map<string, Configuration>,
  ) {
    const contractionEdge = this.contraction.configuration.innerEdge;
    const contractionHead = contractionEdge.head;
    if (!contractionHead) return;
    const compensationEdge = this.compensation?.configuration.innerEdge;

    if (!compensationEdge)
      return console.warn("compensation contraction is not defined");

    // 1. Update (decrement) blocking edges
    contractions.forEach((contractions, edgeUuid) => {
      // console.log(
      //   "blockingNumber before",
      //   contraction.configuration.innerEdge.toString(),
      //   contraction.blockingNumber
      // );
      Object.values(contractions).forEach((d) =>
        d.decrementBlockingNumber(this.x1x2, configurations),
      ); // FIXME: fix blocking Number!! Done?
      // console.log(
      //   "blockingNumber after",
      //   contraction.configuration.innerEdge.toString(),
      //   contraction.blockingNumber
      // );
    });

    const movedPositions: Point[] = [];

    // 2.1 Calculate new positions for contaction edge
    const pointA = this.contraction.point;
    const pointB =
      this.contraction.areaPoints[this.contraction.areaPoints.length - 1];
    const contractionSegment = contractionEdge.toLineSegment();
    if (!contractionSegment) return;
    //const contractionShift = pointA.distanceToLineSegment(contractionSegment);

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

    // console.log("contractionshift", contractionShift, "compensationshift", compensationShift);

    // Check whether one of new positions for the compensation edge are equal
    // to one of the original positions of the contraction ege
    if (
      [contractionEdge.tail, contractionHead].some(
        (point) => point.equals(newTail) || point.equals(newHead),
      )
    ) {
      this.doHalfEdgeMove();
      return; // TODO: remove this return
    }

    // 2.3 Do the contraction and the compensation
    const prevEdgeLineSegment = contractionEdge.prev?.toLineSegment();
    const nextEdgeLineSegment = contractionEdge.next?.toLineSegment();
    if (!prevEdgeLineSegment || !nextEdgeLineSegment) return;

    const newEdge = pointA.isOnLineSegment(prevEdgeLineSegment)
      ? contractionEdge.move(pointA, pointB)
      : contractionEdge.move(pointB, pointA);

    if (newEdge) {
      const newConfiguration = new Configuration(newEdge);
      newConfiguration.initialize(configurations);
      configurations.set(newEdge.uuid, newConfiguration);
      // TODO: add newEdge to facefaceBoundaryList
      // newEdge?.dcel.faceFaceBoundaryList?.addEdge(newEdge);
    }

    movedPositions.push(contractionEdge.tail.toPoint());
    movedPositions.push(contractionHead.toPoint());

    compensationEdge.move(newTail, newHead);

    movedPositions.push(compensationEdge.tail.toPoint());
    const compensationHead = compensationEdge.head?.toPoint();
    if (compensationHead) movedPositions.push(compensationHead);

    // console.log("moved Positions", movedPositions.length);
    // console.log(Array.from(dcel.vertices.keys()));

    const remainingEdges = movedPositions.reduce(
      (acc: HalfEdge[], pos: Point) => {
        const key = `${pos.x}/${pos.y}`;
        const vertex = dcel.vertices.get(key);
        if (!vertex) return acc;
        vertex.edges.forEach((edge) => {
          if (edge.face === contractionEdge.face) acc.push(edge);
          else if (edge.twin) acc.push(edge.twin);
        });
        return acc;
      },
      [],
    );

    // console.log(
    //   "remainingEdges",
    //   remainingEdges.map((e) => e.toString())
    // );

    // 2.4 Update the affected configurations
    this.updateConfigurations(remainingEdges, configurations);

    // console.log("moved vertices", movedPositions);

    // console.log(
    //   contractionEdge.prev?.getUuid() +
    //     " " +
    //     contractionEdge.prev?.tail.xy() +
    //     "->" +
    //     contractionEdge.prev?.head?.xy(),
    //   contractionEdge.getUuid() + " " + contractionEdge.toString(),
    //   contractionEdge.next?.getUuid() + " " + contractionEdge.next?.toString()
    // );

    // TODO: 3. Update (increment) blocking numbers again
    contractions.forEach((contraction, edgeUuid) => {
      Object.values(contraction).forEach((d) =>
        d.incrementBlockingNumber(this.x1x2, configurations),
      );
    });

    //TODO: update uuids of maps?
    return { dcel, contractions, configurations };
  }

  get compensationShift() {
    return this.contraction.area > 0 && this.compensation
      ? this.compensation.getCompensationHeight(this.contraction.area)
      : undefined;
  }

  doHalfEdgeMove() {
    // console.log("halfmove");
    const contractionEdge = this.contraction.configuration.innerEdge;
    const compensationEdge = this.compensation?.configuration.innerEdge;
    const compensationShift = this.compensationShift;
    if (!compensationEdge || !compensationShift) return;
    const normal = compensationEdge
      .getVector()
      ?.unitVector.getNormal(this.compensation?.type === ContractionType.N)
      .times(compensationShift / 2);
    if (!normal) return;
    const newTailComp = compensationEdge.tail.vector.plus(normal).toPoint();
    const newHeadComp = compensationEdge.head?.vector.plus(normal).toPoint();
    const newTailCon = contractionEdge.tail.vector.minus(normal).toPoint();
    const newHeadCon = contractionEdge.head?.vector.minus(normal).toPoint();

    if (newHeadCon) contractionEdge.move(newTailCon, newHeadCon);
    if (newHeadComp) compensationEdge.move(newTailComp, newHeadComp);
  }

  doSimpleEdgeMove(configurations: Map<string, Configuration>) {
    // console.log("simple contraction", this.contraction.point.xy());
    const contractionEdge = this.contraction.configuration.innerEdge;
    const prevAngle = contractionEdge.prev?.getAngle();

    // console.log(
    //   contractionEdge.prev?.toString(),
    //   prevAngle,
    //   contractionEdge.next?.toString(),
    //   contractionEdge.next?.getAngle(),
    //   contractionEdge.getAngle()
    // );

    const vertexToDelete =
      typeof prevAngle === "number" && prevAngle === contractionEdge.getAngle()
        ? contractionEdge.tail
        : contractionEdge.head;
    if (!vertexToDelete) return;
    // console.log("toDelete", vertexToDelete);
    const newEdge = vertexToDelete.remove(contractionEdge.face);
    if (!newEdge || !newEdge.prev || !newEdge.next) return;
    // console.log(newEdge.prev.toString(), newEdge.toString(), newEdge.next.toString());
    this.updateConfigurations(
      [newEdge, newEdge.prev, newEdge.next],
      configurations,
    );
  }

  /**
   * Update the configuration of the in the edge move involved HalfEdges.
   * @param involvedEdges An array of {@link HalfEdges} which are left from the {@link ConfigurationPair}.
   * @returns void, if the {@link Dcel}'s links are not complete.
   */
  updateConfigurations(
    involvedEdges: HalfEdge[],
    configurations: Map<string, Configuration>,
  ) {
    involvedEdges.forEach((edge) => {
      if (edge.endpoints.every((vertex) => vertex.edges.length <= 3))
        configurations.set(edge.uuid, new Configuration(edge));
    });
  }
}

export default ConfigurationPair;
