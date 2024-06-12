import HalfEdge from "../Dcel/HalfEdge";
import Face from "../Dcel/Face";
import Dcel from "../Dcel/Dcel";
import FaceFaceBoundary from "./FaceFaceBoundary";
import ConfigurationPair from "./ConfigurationPair";
import Configuration from "./Configuration";

export type FaceFaceBoundaryMap = Map<string, FaceFaceBoundary>;

class FaceFaceBoundaryList {
  boundaries: FaceFaceBoundaryMap;

  constructor(dcel: Dcel) {
    this.boundaries = this.create(dcel);
  }

  static sortFaces(faceA: Face, faceB: Face) {
    return [faceA, faceB].sort((a, b) => a.uuid.localeCompare(b.uuid));
  }

  /**
   * Gets the key for a Face-Face-Boundary structure.
   * @param faceA The first {@link Face}.
   * @param faceB The second {@link Face}.
   * @returns A string, representing the key for the Face-Face-Boundary structure.
   */
  static getKey(faceA: Face, faceB: Face) {
    return FaceFaceBoundaryList.sortFaces(faceA, faceB)
      .map((d) => d.uuid)
      .join("|");
  }

  /**
   * Creates a Face-Face-Boundary structure from a {@link Dcel}.
   * @param dcel The {@link Dcel} to create the Face-Face-Boundary structure from.
   * @returns A {@link FaceFaceBoundaryMap}, containing the Face-Face-Boundary structure.
   */
  create(dcel: Dcel) {
    const boundaries: Map<string, FaceFaceBoundary> = new Map();

    dcel.getHalfEdges(true).forEach((edge) => {
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

  /**
   * Gets the Face-Face-Boundary structure.
   * @returns An array of {@link FaceFaceBoundary}s.
   */
  getBoundaries() {
    return Array.from(this.boundaries.values());
  }

  /**
   * Gets the overall minimal configuration pair of a Face-Face-Boundary structure.
   * @returns A tuple, containing 2 complementary, non-conflicting {@link Contraction}s, the minimal Configuration Pair.
   */
  getMinimalConfigurationPair(configurations: Map<string, Configuration>) {
    return this.getBoundaries().reduce(
      (minimum: ConfigurationPair | undefined, boundary) => {
        const boundaryPair =
          boundary.getMinimalConfigurationPair(configurations);
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
