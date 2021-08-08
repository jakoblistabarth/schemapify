import HalfEdge from "../DCEL/HalfEdge";
import Face from "../DCEL/Face";
import Dcel from "../DCEL/Dcel";
import FaceFaceBoundary from "./FaceFaceBoundary";
import Contraction from "./Contraction";
import ConfigurationPair from "./ConfigurationPair";

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

  getBoundaries(): FaceFaceBoundary[] {
    return [...this.boundaries].map(([k, e]) => e);
  }

  /**
   * Gets the overall minimal configuration pair of a Face-Face-Boundary structure.
   * @returns A tuple, containing 2 complementairy, non-conflicting {@link Contraction}s, the minimal Configuration Pair.
   */
  getMinimalConfigurationPair(): ConfigurationPair | undefined {
    return this.getBoundaries().reduce((minimum: ConfigurationPair | undefined, boundary) => {
      const boundaryPair = boundary.getMinimalConfigurationPair();
      if (boundaryPair && (!minimum || boundaryPair.contraction.area < minimum.contraction.area))
        minimum = boundaryPair;
      return minimum;
    }, undefined);
  }

  update(dcel: Dcel, EdgesToDelete: HalfEdge[], EdgesToAdd: HalfEdge[]) {
    //do something
  }
}

export default FaceFaceBoundaryList;
