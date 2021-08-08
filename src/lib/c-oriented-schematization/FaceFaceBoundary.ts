import HalfEdge from "../DCEL/HalfEdge";
import Face from "../DCEL/Face";
import Contraction, { ContractionType } from "./Contraction";
import ConfigurationPair from "./ConfigurationPair";

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
  getMinimalConfigurationPair(): ConfigurationPair | undefined {
    const pContractions = this.edges
      .reduce((contractions: Contraction[], edge) => {
        const pContraction = edge.configuration?.[ContractionType.P];
        if (pContraction && pContraction.isFeasible()) contractions.push(pContraction);
        return contractions;
      }, [])
      .sort((a, b) => a.area - b.area);

    const nContractions = this.edges
      .reduce((contractions: Contraction[], edge) => {
        const nContraction = edge.configuration?.[ContractionType.N];
        if (nContraction && nContraction.isFeasible()) contractions.push(nContraction);
        return contractions;
      }, [])
      .sort((a, b) => a.area - b.area);

    const contractionCandidates = [...pContractions.slice(0, 6), ...nContractions.slice(0, 6)].sort(
      (a, b) => a.area - b.area
    );

    type CompensationCandidate = { contraction: Contraction; distance: number };

    let contraction: Contraction | undefined;
    let compensation: Contraction | undefined;
    for (const contractionCandidate of contractionCandidates) {
      const compensationCandidates =
        contractionCandidate.type === ContractionType.N ? pContractions : nContractions;
      const compensationCandidate = compensationCandidates
        .reduce((solutions: CompensationCandidate[], candidate) => {
          if (!candidate.isConflicting(contractionCandidate))
            solutions.push({
              contraction: candidate,
              distance: contractionCandidate.configuration.innerEdge.getMinimalCycleDistance(
                candidate.configuration.innerEdge
              ),
            });
          return solutions;
        }, [])
        .sort((a, b) => a.distance - b.distance)[0];
      if (compensationCandidate) {
        contraction = contractionCandidate;
        compensation = compensationCandidate.contraction;
        break;
      }
    }
    if (contraction && compensation) return new ConfigurationPair(contraction, compensation);
  }
}

export default FaceFaceBoundary;
