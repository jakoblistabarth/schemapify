import HalfEdge from "../DCEL/HalfEdge";
import Face from "../DCEL/Face";
import Dcel from "../DCEL/Dcel";

export type FaceFaceBoundaryMap = Map<string, HalfEdge[]>;

class FaceFaceBoundaries {
  boundaries: FaceFaceBoundaryMap;

  constructor(dcel: Dcel) {
    this.boundaries = this.createFaceFaceBoundaries(dcel);
  }

  static getKey(faces: Face[]): string {
    faces.sort();
    return `${faces[0].getUuid(10)}|${faces[1].getUuid(10)}`;
  }

  createFaceFaceBoundaries(dcel: Dcel): FaceFaceBoundaryMap {
    const boundaries = new Map();
    dcel.getHalfEdges(undefined, true).forEach((edge) => {
      const key = FaceFaceBoundaries.getKey([edge.face, edge.twin.face]);
      if (boundaries.has(key)) boundaries.get(key).push(edge);
      else boundaries.set(key, [edge]);
    });
    return boundaries;
  }
}

export default FaceFaceBoundaries;
