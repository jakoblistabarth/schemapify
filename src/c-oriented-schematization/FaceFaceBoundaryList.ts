import HalfEdge from "../DCEL/HalfEdge";
import Face from "../DCEL/Face";
import Dcel from "../DCEL/Dcel";
import FaceFaceBoundary from "./FaceFaceBoundary";
import ConfigurationPair from "./ConfigurationPair";

export type FaceFaceBoundaryMap = Map<string, FaceFaceBoundary>;

class FaceFaceBoundaryList {
  boundaries: FaceFaceBoundaryMap;

  constructor(dcel: Dcel) {
    this.boundaries = this.create(dcel);
  }

  static sortFaces(faceA: Face, faceB: Face) {
    return [faceA, faceB].sort((a, b) => a.uuid.localeCompare(b.uuid));
  }

  static getKey(faceA: Face, faceB: Face): string {
    return FaceFaceBoundaryList.sortFaces(faceA, faceB)
      .map((d) => d.uuid)
      .join("|");
  }

  create(dcel: Dcel) {
    const boundaries: Map<string, FaceFaceBoundary> = new Map();

    dcel.getHalfEdges(undefined, true).forEach((edge) => {
      if (!edge.face || !edge.twin?.face) return;
      const faces = [edge.face, edge.twin?.face] as [Face, Face];
      const key = FaceFaceBoundaryList.getKey(...faces);
      const sortedFaces = FaceFaceBoundaryList.sortFaces(...faces);
      const edgeToAdd =
        edge.face.uuid === sortedFaces[0].uuid ? edge : edge.twin;
      if (!edgeToAdd) return;
      if (boundaries.has(key)) boundaries.get(key)?.edges.push(edgeToAdd);
      else boundaries.set(key, new FaceFaceBoundary(...faces, edgeToAdd));
    });

    return boundaries;
  }

  getBoundaries(): FaceFaceBoundary[] {
    return Array.from(this.boundaries.values());
  }

  /**
   * Gets the overall minimal configuration pair of a Face-Face-Boundary structure.
   * @returns A tuple, containing 2 complementary, non-conflicting {@link Contraction}s, the minimal Configuration Pair.
   */
  getMinimalConfigurationPair(): ConfigurationPair | undefined {
    return this.getBoundaries().reduce(
      (minimum: ConfigurationPair | undefined, boundary) => {
        const boundaryPair = boundary.getMinimalConfigurationPair();
        if (
          boundaryPair &&
          (!minimum || boundaryPair.contraction.area < minimum.contraction.area)
        )
          minimum = boundaryPair;
        return minimum;
      },
      undefined,
    );
  }

  /**
   * Adds the edge to the face-face-boundary-list.
   * @param edge The {@link HalfEdge} which should be added to the respective {@link FaceFaceBoundary}
   * @returns The added {@link HalfEdge}.
   */
  addEdge(edge: HalfEdge) {
    if (!edge.face || !edge.twin?.face) return;
    const key = FaceFaceBoundaryList.getKey(edge.face, edge.twin?.face);
    this.boundaries.get(key)?.edges.push(edge);
    return edge;
  }
}

export default FaceFaceBoundaryList;
