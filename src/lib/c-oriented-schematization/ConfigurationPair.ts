import Contraction, { ContractionType } from "./Contraction";
import Configuration from "./Configuration";
import HalfEdge from "../DCEL/HalfEdge";
import Point from "../geometry/Point";

class ConfigurationPair {
  contraction: Contraction;
  compensation?: Contraction;

  constructor(contraction: Contraction, compensation?: Contraction) {
    this.contraction = contraction;
    this.compensation = compensation;
  }

  /**
   * Get all edges of the configurations involved in the edge move (contraction and a possible and the compensation).
   * @returns An array of {@link HalfEdge}s.
   */
  getX1X2(): HalfEdge[] {
    const x1x2 = this.contraction.configuration.getX();
    if (this.compensation) x1x2.push(...this.compensation.configuration.getX());
    return x1x2;
  }

  doEdgeMove() {
    const contractionEdge = this.contraction.configuration.innerEdge;
    const contractionHead = contractionEdge.getHead();
    if (!contractionHead) return;
    const dcel = contractionEdge.dcel;
    const compensationEdge =
      this.contraction.area > 0 ? this.compensation?.configuration.innerEdge : undefined;

    // 0. Do a simple vertex deletion, in case of a contraction with area 0
    if (!compensationEdge) {
      this.doSimpleEdgeMove();
      return;
    }

    // 1. Update (decrement) blocking edges
    dcel.getContractions().forEach((contraction) => {
      // console.log(
      //   "blockingNumber before",
      //   contraction.configuration.innerEdge.toString(),
      //   contraction.blockingNumber
      // );
      contraction.decrementBlockingNumber(this.getX1X2()); // FIXME: fix blocking Number!! Done?
      // console.log(
      //   "blockingNumber after",
      //   contraction.configuration.innerEdge.toString(),
      //   contraction.blockingNumber
      // );
    });

    const movedPositions: Point[] = [];

    // 2.1 Calculate new positions for contaction edge
    const pointA = this.contraction.point;
    const pointB = this.contraction.areaPoints[this.contraction.areaPoints.length - 1];

    // 2.2 Calculate compensation trapeze height
    const shift = this.getShift();
    if (!shift) return;

    // 2.3 Calculate new positions for compensation edge
    let normal = compensationEdge
      .getVector()
      ?.getUnitVector()
      .getNormal(this.compensation?.type === ContractionType.N)
      .times(shift);
    if (!normal) return;
    const newTail = compensationEdge.tail.toVector().plus(normal).toPoint();
    const newHead = compensationEdge.getHead()?.toVector().plus(normal).toPoint();
    if (!newHead) return;

    // Check whether one of new positions for the compensation edge are equal
    // to one of the original positions of the contraction ege
    console.log(
      "equals?",
      [
        contractionEdge.tail.toPoint(),
        contractionEdge.getHead()?.toPoint() as Point,
        newTail,
        newHead,
      ].map((p) => p.xy())
    );

    if (
      [contractionEdge.tail, contractionHead].some(
        (point) => point.equals(newTail) || point.equals(newHead)
      )
    ) {
      this.doHalfEdgeMove();
      return;
    }

    // 2.3 Do the contraction and the compensation
    const prevEdgeLineSegment = contractionEdge.prev?.toLineSegment();
    const nextEdgeLineSegment = contractionEdge.next?.toLineSegment();
    if (!prevEdgeLineSegment || !nextEdgeLineSegment) return;

    if (pointA.isOnLineSegment(prevEdgeLineSegment)) {
      contractionEdge.move(pointA, pointB);
    } else contractionEdge.move(pointB, pointA);

    movedPositions.push(contractionEdge.tail.toPoint());
    movedPositions.push(contractionHead);

    compensationEdge.move(newTail, newHead);

    movedPositions.push(compensationEdge.tail.toPoint());
    const compensationHead = compensationEdge.getHead()?.toPoint();
    if (compensationHead) movedPositions.push(compensationHead);

    console.log("moved Positions", movedPositions.length);
    console.log(Array.from(dcel.vertices.keys()));

    const remainingEdges = movedPositions.reduce((acc: HalfEdge[], pos: Point) => {
      let key = `${pos.x}/${pos.y}`;
      const vertex = dcel.vertices.get(key);
      if (!vertex) return acc;
      vertex.edges.forEach((edge) => {
        if (edge.face === contractionEdge.face) acc.push(edge);
        else if (edge.twin) acc.push(edge.twin);
      });
      return acc;
    }, []);

    console.log(
      "remainingEdges",
      remainingEdges.map((e) => e.toString())
    );

    // 2.4 Update the affected configurations
    this.updateConfigurations(remainingEdges);

    console.log("moved vertices", movedPositions);

    console.log(
      contractionEdge.prev?.getUuid() +
        " " +
        contractionEdge.prev?.tail.xy() +
        "->" +
        contractionEdge.prev?.getHead()?.xy(),
      contractionEdge.getUuid() + " " + contractionEdge.toString(),
      contractionEdge.next?.getUuid() + " " + contractionEdge.next?.toString()
    );

    // TODO: 3. Update (increment) blocking numbers again
    dcel.getContractions().forEach((contraction) => {
      contraction.incrementBlockingNumber(this.getX1X2());
    });
  }

  getShift() {
    return this.contraction.area > 0 && this.compensation
      ? this.compensation.getCompensationHeight(this.contraction.area)
      : undefined;
  }

  doHalfEdgeMove() {
    const contractionEdge = this.contraction.configuration.innerEdge;
    const compensationEdge = this.compensation?.configuration.innerEdge;
    const shift = this.getShift();
    if (!compensationEdge || !shift) return;
    const normal = compensationEdge
      .getVector()
      ?.getUnitVector()
      .getNormal(this.compensation?.type === ContractionType.N)
      .times(shift / 2);
    if (!normal) return;
    const newTailComp = compensationEdge.tail.toVector().plus(normal).toPoint();
    const newHeadComp = compensationEdge.getHead()?.toVector().plus(normal).toPoint();
    const newTailCon = contractionEdge.tail.toVector().minus(normal).toPoint();
    const newHeadCon = contractionEdge.getHead()?.toVector().minus(normal).toPoint();

    if (newHeadCon) contractionEdge.move(newTailCon, newHeadCon);
    if (newHeadComp) compensationEdge.move(newTailComp, newHeadComp);
  }

  doSimpleEdgeMove() {
    console.log("simple contraction", this.contraction.point.xy());
    const contractionEdge = this.contraction.configuration.innerEdge;
    const prevAngle = contractionEdge.prev?.getAngle();

    console.log(
      contractionEdge.prev?.toString(),
      prevAngle,
      contractionEdge.next?.toString(),
      contractionEdge.next?.getAngle(),
      contractionEdge.getAngle()
    );

    const vertexToDelete =
      typeof prevAngle === "number" && prevAngle === contractionEdge.getAngle()
        ? contractionEdge.tail
        : contractionEdge.getHead();
    if (!vertexToDelete) return;
    console.log("toDelete", vertexToDelete);
    const newEdge = vertexToDelete.remove(contractionEdge.face);
    if (!newEdge || !newEdge.prev || !newEdge.next) return;
    console.log(newEdge.prev.toString(), newEdge.toString(), newEdge.next.toString());
    this.updateConfigurations([newEdge, newEdge.prev, newEdge.next]);
  }

  /**
   * Update the configuration of the in the edge move involved HalfEdges.
   * @param involvedEdges An array of {@link HalfEdges} which are left from the {@link ConfigurationPair}.
   * @returns void, if the {@link Dcel}'s links are not complete.
   */
  updateConfigurations(involvedEdges: HalfEdge[]) {
    involvedEdges.forEach((edge) => {
      if (edge.getEndpoints().every((vertex) => vertex.edges.length <= 3))
        edge.configuration = new Configuration(edge);
    });
  }
}

export default ConfigurationPair;
