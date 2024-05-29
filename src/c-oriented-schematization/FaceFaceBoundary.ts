import HalfEdge from "../Dcel/HalfEdge";
import Face from "../Dcel/Face";
import Contraction from "./Contraction";
import ConfigurationPair from "./ConfigurationPair";
import { ContractionType } from "./ContractionType";

class FaceFaceBoundary {
  faces: [Face, Face];
  edges: HalfEdge[];

  constructor(faceA: Face, faceB: Face, edge: HalfEdge) {
    this.faces = [faceA, faceB];
    this.edges = [edge];
  }

  /**
   * Gets the minimal configuration pair of a face-face-boundary. Using the 6 smallest positive and negative contractions, as described in Buchin et al. 2016.
   * @returns A tuple of two complementary, feasible contractions, posing  minimal configuration pair of a {@link FaceFaceBoundary}.
   */
  getMinimalConfigurationPair() {
    const pContractions = this.edges
      .reduce((contractions: Contraction[], edge) => {
        const pContraction = edge.configuration?.[ContractionType.P];
        if (pContraction?.isFeasible) contractions.push(pContraction);
        return contractions;
      }, [])
      .sort((a, b) => a.area - b.area);

    const nContractions = this.edges
      .reduce((contractions: Contraction[], edge) => {
        const nContraction = edge.configuration?.[ContractionType.N];
        if (nContraction?.isFeasible) contractions.push(nContraction);
        return contractions;
      }, [])
      .sort((a, b) => a.area - b.area);

    const contractionCandidates = [
      ...pContractions.slice(0, 6),
      ...nContractions.slice(0, 6),
    ].sort((a, b) => a.area - b.area);

    type CompensationCandidate = { contraction: Contraction; distance: number };
    let contraction: Contraction | undefined;
    let compensation: Contraction | undefined;
    for (const contractionCandidate of contractionCandidates) {
      const compensationCandidates =
        contractionCandidate.type === ContractionType.N
          ? pContractions
          : nContractions;
      const compensationCandidate = compensationCandidates
        .reduce((solutions: CompensationCandidate[], candidate) => {
          // console.log(
          //   contractionCandidate.configuration.innerEdge.toString(),
          //   contractionCandidate.area,
          //   "->",
          //   contractionCandidate.point.xy(),
          //   candidate.configuration.innerEdge.toString(),
          //   candidate.area,
          //   "->",
          //   candidate.point.xy(),
          //   "not conflicts:",
          //   !candidate.isConflicting(contractionCandidate)
          // );
          if (
            !candidate.isConflicting(contractionCandidate) &&
            contractionCandidate.area <= candidate.area
          )
            solutions.push({
              contraction: candidate,
              distance:
                contractionCandidate.configuration.innerEdge.getMinimalCycleDistance(
                  candidate.configuration.innerEdge,
                ),
            });
          return solutions;
        }, [])
        .sort((a, b) => a.distance - b.distance)[0];
      if (contractionCandidate.area === 0 || compensationCandidate) {
        contraction = contractionCandidate;
        compensation =
          contractionCandidate.area > 0
            ? compensationCandidate.contraction
            : undefined;
        break;
      }
    }

    if (contraction && compensation)
      return new ConfigurationPair(contraction, compensation);
    if (contraction) return new ConfigurationPair(contraction);
  }
}

export default FaceFaceBoundary;
