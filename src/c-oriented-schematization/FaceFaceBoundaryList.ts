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

  static getKey(faceA: Face, faceB: Face): string {
    return [faceA, faceB]
      .map((d) => d.getUuid(10))
      .sort()
      .join("|");
  }

  create(dcel: Dcel) {
    const boundaries: Map<string, FaceFaceBoundary> = new Map();

    dcel.getHalfEdges(undefined, true).forEach((edge) => {
      if (!edge.face || !edge.twin?.face) return;
      const key = FaceFaceBoundaryList.getKey(edge.face, edge.twin.face);
      if (boundaries.has(key)) boundaries.get(key)?.edges.push(edge);
      else
        boundaries.set(
          key,
          new FaceFaceBoundary(edge.face, edge.twin.face, edge),
        );
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
