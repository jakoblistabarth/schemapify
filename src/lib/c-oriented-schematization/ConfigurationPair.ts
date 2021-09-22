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

    // console.log(
    //   "contractionEdge:",
    //   contractionEdge?.toString(),
    //   this.contraction.point.xy(),
    //   this.contraction.area
    // );
    // console.log("compensationEdge:", compensationEdge?.toString());

    //TODO: update blocking edges
    dcel
      .getHalfEdges()
      .reduce((acc: Contraction[], edge) => {
        const n = edge.configuration?.[ContractionType.N];
        const p = edge.configuration?.[ContractionType.P];
        if (n) acc.push(n);
        if (p) acc.push(p);
        return acc;
      }, [])
      .forEach((contraction) => {
        contraction.areaPoints;
      });

    // calculate compensation trapeze height
    const shift =
      this.contraction.area > 0 && this.compensation
        ? this.compensation.getCompensationHeight(this.contraction.area)
        : undefined;
    // console.log(shift);

    // do compensation, if necessary
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

    // do contraction
    const pointA = this.contraction.point;
    const pointB = this.contraction.areaPoints[this.contraction.areaPoints.length - 1];
    if (
      contractionEdge.prev?.tail.equals(pointA) ||
      contractionEdge.next?.getHead()?.equals(pointB)
    )
      contractionEdge.move(pointA, pointB);
    else contractionEdge.move(pointB, pointA);

    //TODO: update only affected configurations
    // const affectedEdges = [
    //   contractionEdge.prev,
    //   contractionEdge,
    //   contractionEdge.next,
    //   compensationEdge?.prev,
    //   compensationEdge,
    //   compensationEdge?.next,
    // ];
    // console.log(affectedEdges);

    // affectedEdges.forEach((edge) => {
    //   if (!edge || !edge.configuration) return;
    //   console.log("affected", edge.face?.getUuid(5), edge.twin?.face?.getUuid(5));

    // if (edge.getEndpoints().every((vertex) => vertex.edges.length <= 3)) {
    //   edge.configuration = new Configuration(edge);
    // }
    // });

    // TODO: update blocking edges number again

    if (!contractionEdge?.face || !contractionEdge.twin?.face) return;
    const key = FaceFaceBoundaryList.getKey(contractionEdge.face, contractionEdge.twin?.face);
    dcel.faceFaceBoundaryList?.boundaries.get(key)?.edges.forEach((edge) => {
      // console.log("all", edge.face?.getUuid(5), edge.twin?.face?.getUuid(5));

      if (edge.getEndpoints().every((vertex) => vertex.edges.length <= 3))
        edge.configuration = new Configuration(edge);
    });
  }
}

export default ConfigurationPair;
