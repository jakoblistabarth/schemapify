import Contraction, { ContractionType } from "./Contraction";
import Configuration from "./Configuration";
import FaceFaceBoundaryList from "./FaceFaceBoundaryList";
import HalfEdge from "../DCEL/HalfEdge";
import Vertex from "../DCEL/Vertex";

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
    // const contractionArea = Number(this.contraction.area.toFixed(10));
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

    // 1. Update blocking edges
    dcel.getContractions().forEach((contraction) => {
      // console.log(
      //   "blockingNumber before",
      //   contraction.configuration.innerEdge.toString(),
      //   contraction.blockingNumber
      // );
      contraction.decrementBlockingNumber(this.getX1X2()); // FIXME: fix blocking Number!!
      // console.log(
      //   "blockingNumber after",
      //   contraction.configuration.innerEdge.toString(),
      //   contraction.blockingNumber
      // );
    });

    const movedVertices: Vertex[] = [];

    // 2.1 Do the contraction
    const pointA = this.contraction.point;
    const pointB = this.contraction.areaPoints[this.contraction.areaPoints.length - 1];
    const prevEdgeLineSegment = contractionEdge.prev?.toLineSegment();
    const nextEdgeLineSegment = contractionEdge.next?.toLineSegment();
    if (!prevEdgeLineSegment || !nextEdgeLineSegment) return;

    if (pointA.isOnLineSegment(prevEdgeLineSegment)) {
      contractionEdge.move(pointA, pointB);
    } else contractionEdge.move(pointB, pointA);

    movedVertices.push(contractionEdge.tail);
    const contractionHead = contractionEdge.getHead();
    if (contractionHead) movedVertices.push(contractionHead);

    // 2.1 Calculate compensation trapeze height
    const shift =
      this.contraction.area > 0 && this.compensation
        ? this.compensation.getCompensationHeight(this.contraction.area)
        : undefined;

    // 2.2 Do the compensation, if necessary
    if (compensationEdge && typeof shift === "number") {
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

      movedVertices.push(compensationEdge.tail);
      const compensationHead = compensationEdge.getHead();
      if (compensationHead) movedVertices.push(compensationHead);
    }

    console.log(movedVertices.length);
    console.log(Array.from(dcel.vertices.keys()));

    // 2.3 Remove redundant vertices
    movedVertices.forEach((vertex) => {
      const key = Vertex.getKey(vertex.x, vertex.y);
      console.log(
        key,
        dcel.vertices.get(key)?.edges.map((e) => e.toString())
      );

      if (dcel.vertices.has(key)) {
        const redundantVertex = dcel.vertices.get(key);
        if (!redundantVertex) return;
        redundantVertex.edges = vertex.edges;
        const newEdge = redundantVertex.remove(contractionEdge.face);
        if (!newEdge) return;
        dcel.vertices.set(key, redundantVertex);
        dcel.faceFaceBoundaryList?.addEdge(newEdge);
        newEdge.configuration = new Configuration(newEdge);
      } else {
        dcel.vertices.set(key, vertex);
      }
      dcel.vertices.delete(key + "m");
    });

    // 2.4 Update the affected configurations
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

    if (!contractionEdge?.face || !contractionEdge.twin?.face) return;
    const key = FaceFaceBoundaryList.getKey(contractionEdge.face, contractionEdge.twin?.face);
    dcel.faceFaceBoundaryList?.boundaries.get(key)?.edges.forEach((edge) => {
      // console.log("all", edge.face?.getUuid(5), edge.twin?.face?.getUuid(5));

      if (edge.getEndpoints().every((vertex) => vertex.edges.length <= 3))
        edge.configuration = new Configuration(edge);
    });

    console.log("moved vertices", movedVertices);

    console.log(
      contractionEdge.prev?.getUuid() +
        " " +
        contractionEdge.prev?.tail.xy() +
        "->" +
        contractionEdge.prev?.getHead()?.xy(),
      contractionEdge.getUuid() + " " + contractionEdge.toString(),
      contractionEdge.next?.getUuid() + " " + contractionEdge.next?.toString()
    );

    // TODO: 3. Update blocking numbers again
    dcel.getContractions().forEach((contraction) => {
      contraction.incrementBlockingNumber(this.getX1X2());
    });
  }
}

export default ConfigurationPair;
