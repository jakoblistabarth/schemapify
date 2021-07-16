import { v4 as uuid } from "uuid";
import { getPolygonArea } from "../utilities";
import HalfEdge from "./HalfEdge";

class Face {
  uuid: string;
  edge: HalfEdge;
  innerEdges: Array<HalfEdge>;
  outerRing: Face;
  FID: number[];

  constructor() {
    this.uuid = uuid(); // unique ID per face
    this.edge = null; // pointer to an arbitrary edge of the outer connected component (boundary) of this face
    this.innerEdges = null; // iterator of edges, one for each inner connected component (holes) of this face
    this.outerRing = null; // only for holes, pointer to the outerRing it belongs to
    this.FID = null; // ID per geoJSON feature
  }

  /**
   *
   * @param stop defines how many strings of the uuid are returned
   * @returns the edge's uuid
   */
  getUuid(length?: number) {
    return this.uuid.substring(0, length);
  }

  getEdges(counterclockwise: boolean = true): Array<HalfEdge> {
    return this.edge.getCycle(counterclockwise);
  }

  removeInnerEdge(edge: HalfEdge): Array<HalfEdge> {
    const idx = this.innerEdges.indexOf(edge);
    if (idx > -1) {
      this.innerEdges.splice(idx, 1);
    }
    return this.innerEdges;
  }

  replaceInnerEdge(old: HalfEdge, edge: HalfEdge): Array<HalfEdge> {
    const idx = this.innerEdges.indexOf(old);
    if (idx === -1) {
      return;
    } else {
      this.innerEdges[idx] = edge;
    }
    return this.innerEdges;
  }

  replaceOuterRingEdge(old: HalfEdge, edge: HalfEdge): HalfEdge {
    if (this.outerRing.edge != old) {
      return;
    } else {
      this.outerRing.edge = edge;
      return this.outerRing.edge;
    }
  }

  /**
   * Get the Area of the face.
   * @returns A number, indicating the size of the {@link Face}.
   */
  getArea(): number {
    const vertices = this.getEdges().map((edge) => edge.getTail());
    return getPolygonArea(vertices);
  }
}

export default Face;
