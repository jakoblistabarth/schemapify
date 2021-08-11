import Contraction, { ContractionType } from "./Contraction";
import Configuration from "./Configuration";
import FaceFaceBoundaryList from "./FaceFaceBoundaryList";

class ConfigurationPair {
  contraction: Contraction;
  compensation?: Contraction;

  constructor(contraction: Contraction, compensation?: Contraction) {
    this.contraction = contraction;
    this.compensation = compensation;
  }

  doEdgeMove() {
    const contractionEdge = this.contraction.configuration.innerEdge;
    const compensationEdge =
      this.contraction.area > 0 ? this.compensation?.configuration.innerEdge : undefined;
    const dcel = contractionEdge.dcel;

    console.log(
      "contractionEdge:",
      contractionEdge?.toString(),
      this.contraction.point.xy(),
      this.contraction.area
    );
    console.log("compensationEdge:", compensationEdge?.toString());

    //TODO: update blockingedges
    dcel.getHalfEdges().forEach((edge) => {
      const contractions = [
        edge.configuration?.[ContractionType.N],
        edge.configuration?.[ContractionType.P],
      ];
      contractions.forEach((contraction) => {
        const contractionIdx = contraction?.blockingEdges.indexOf(contractionEdge);
        if (typeof contractionIdx === "number" && contractionIdx >= 0)
          contraction?.blockingEdges.splice(contractionIdx, 1);
        if (!compensationEdge) return;
        const compensationIdx = contraction?.blockingEdges.indexOf(compensationEdge);
        if (typeof compensationIdx === "number" && compensationIdx >= 0)
          contraction?.blockingEdges.splice(compensationIdx, 1);
      });
    });

    // 1. calculate compensation trapeze height
    const shift =
      this.contraction.area > 0 && this.compensation
        ? this.compensation.getCompensationHeight(this.contraction.area)
        : undefined;
    console.log(shift);

    // 2. do compensation, if necessary
    if (compensationEdge && typeof shift === "number" && shift > 0) {
      const normal = compensationEdge
        .getVector()
        ?.getUnitVector()
        .getNormal(this.compensation?.type === ContractionType.N)
        .times(shift);
      if (!normal) return;
      const newTail = compensationEdge.tail.toVector().plus(normal).toPoint();
      const newHead = compensationEdge.getHead()?.toVector().plus(normal).toPoint();
      if (!newHead) return;
      compensationEdge.move(newTail, newHead);
    }

    // 1. do contraction
    const pointA = this.contraction.point;
    const pointB = this.contraction.areaPoints[this.contraction.areaPoints.length - 1];
    if (
      contractionEdge.prev?.tail.equals(pointA) ||
      contractionEdge.next?.getHead()?.equals(pointB)
    )
      contractionEdge.move(pointA, pointB);
    else contractionEdge.move(pointB, pointA);

    //TODO: update (affected) configurations
    if (!contractionEdge?.face || !contractionEdge.twin?.face) return;
    const key = FaceFaceBoundaryList.getKey(contractionEdge.face, contractionEdge.twin?.face);
    dcel.faceFaceBoundaryList?.boundaries.get(key)?.edges.forEach((edge) => {
      if (edge.getEndpoints().every((vertex) => vertex.edges.length <= 3))
        edge.configuration = new Configuration(edge);
    });
  }
}

export default ConfigurationPair;
