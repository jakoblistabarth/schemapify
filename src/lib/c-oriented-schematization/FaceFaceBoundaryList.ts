import HalfEdge from "../DCEL/HalfEdge";
import Face from "../DCEL/Face";
import Dcel from "../DCEL/Dcel";
import FaceFaceBoundary from "./FaceFaceBoundary";

export type FaceFaceBoundaryMap = Map<string, FaceFaceBoundary>;

class FaceFaceBoundaryList {
  boundaries: FaceFaceBoundaryMap;

  constructor(dcel: Dcel) {
    this.boundaries = this.create(dcel);
  }

  static getKey(faceA: Face, faceB: Face): string {
    const faces = [faceA, faceB];
    faces.sort();
    return `${faces[0].getUuid(10)}|${faces[1].getUuid(10)}`;
  }

  create(dcel: Dcel) {
    const boundaries: Map<string, FaceFaceBoundary> = new Map();

    dcel.getHalfEdges(undefined, true).forEach((edge) => {
      if (!edge.face || !edge.twin?.face) return;
      const key = FaceFaceBoundaryList.getKey(edge.face, edge.twin.face);
      if (boundaries.has(key)) boundaries.get(key)?.edges.push(edge);
      else boundaries.set(key, new FaceFaceBoundary(edge.face, edge.twin.face, edge));
    });

    return boundaries;
  }

  // getBoundary(): FaceFaceBoundary {
  //   return;
  // }

  update(dcel: Dcel, EdgesToDelete: HalfEdge[], EdgesToAdd: HalfEdge[]) {
    //do something
  }
}

export default FaceFaceBoundaryList;
