import HalfEdge from "../DCEL/HalfEdge";
import Vertex from "../DCEL/Vertex";
import Line from "../geometry/Line";
import { crawlArray } from "../utilities";
import Contraction, { ContractionType } from "./Contraction";

export enum OuterEdge {
  PREV = "prev",
  NEXT = "next",
}

export enum Junction {
  A = "aligned",
  B = "unalignedDifferentSide",
  C = "unalignedSameSide",
}

class Configuration {
  innerEdge: HalfEdge;
  [ContractionType.N]?: Contraction;
  [ContractionType.P]?: Contraction;

  constructor(edge: HalfEdge) {
    this.innerEdge = edge; // TODO: not very elegant, similar problem to saving the dcel explicitly to Vertices and HalfEdges.
    this[ContractionType.N] = Contraction.initialize(this, ContractionType.N);
    this[ContractionType.P] = Contraction.initialize(this, ContractionType.P);
  }

  getOuterEdge(position: OuterEdge): HalfEdge {
    return position === OuterEdge.PREV ? this.innerEdge.prev : this.innerEdge.next;
  }

  /**
   * Gets all 3 edges forming the configuration.
   * @returns An array of {@link HalfEdge}s.
   */
  getX(): HalfEdge[] {
    return [this.getOuterEdge(OuterEdge.PREV), this.innerEdge, this.getOuterEdge(OuterEdge.NEXT)];
  }

  /**
   * Gets all edges of the polygon's boundary to which the configuration belongs, unless the 3 edges forming the configuration.
   * Kind of the inverse to getX().
   * @returns An array of {@link HalfEdge}s.
   */
  getX_(): HalfEdge[] {
    return this.innerEdge.getCycle().filter((edge) => !this.getX().includes(edge));
  }

  getTrack(outerEdge: OuterEdge): Line {
    if (outerEdge === OuterEdge.PREV)
      return new Line(this.innerEdge.getTail(), this.getOuterEdge(OuterEdge.PREV).getAngle());
    else return new Line(this.innerEdge.getHead(), this.getOuterEdge(OuterEdge.NEXT).getAngle());
  }

  getTracks(): Line[] {
    return [this.getTrack(OuterEdge.PREV), this.getTrack(OuterEdge.NEXT)];
  }

  hasJunction(): boolean {
    return this.innerEdge.getEndpoints().some((p) => p.edges.length > 2);
  }

  getJunctionType(vertex: Vertex): Junction {
    let idx = vertex.edges.indexOf(this.innerEdge);
    idx = idx === -1 ? vertex.edges.indexOf(this.innerEdge.twin) : idx;
    const edge1 = crawlArray(vertex.edges, idx, +1);
    const edge2 = crawlArray(vertex.edges, idx, +2);

    if (edge1.getAngle() === edge2.twin.getAngle()) return Junction.A;
    const normal = this.innerEdge.getVector().getNormal();

    const o1 = edge1.getVector().dot(normal);
    const o2 = edge2.getVector().dot(normal);
    if ((o1 > 0 && o2 < 0) || (o1 < 0 && o2 > 0)) return Junction.B;
    else return Junction.C;
  }
}

export default Configuration;
