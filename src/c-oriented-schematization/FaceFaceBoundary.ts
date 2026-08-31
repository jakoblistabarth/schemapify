import Face from "../Dcel/Face";
import HalfEdge from "../Dcel/HalfEdge";
import Configuration from "./Configuration";
import ConfigurationPair from "./ConfigurationPair";
import Contraction from "./Contraction";
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
   * @param configurations The current configuration map, containing all configurations of the current DCEL state.
   * @returns A tuple of two complementary, feasible contractions, posing the minimal configuration pair of a {@link FaceFaceBoundary}.
   */
  getMinimalConfigurationPair(configurations: Map<string, Configuration>) {
    /** A contraction paired with its area, which the sorts below would otherwise re-derive per comparison. */
    type Candidate = { contraction: Contraction; area: number };

    const feasibleContractions = (type: ContractionType) =>
      this.edges
        .reduce((candidates: Candidate[], edge) => {
          const configuration = edge.coordKey
            ? configurations.get(edge.coordKey)
            : undefined;
          const contraction = configuration?.[type];
          if (contraction?.isFeasible)
            candidates.push({ contraction, area: contraction.area });
          return candidates;
        }, [])
        .sort((a, b) => a.area - b.area);

    const pContractions = feasibleContractions(ContractionType.P);
    const nContractions = feasibleContractions(ContractionType.N);

    const contractionCandidates = [
      ...pContractions.slice(0, 6),
      ...nContractions.slice(0, 6),
    ].sort((a, b) => a.area - b.area);

    type CompensationCandidate = { contraction: Contraction; distance: number };
    let contraction: Contraction | undefined;
    let compensation: Contraction | undefined;
    for (const contractionCandidate of contractionCandidates) {
      const compensationCandidates =
        contractionCandidate.contraction.type === ContractionType.N
          ? pContractions
          : nContractions;
      const compensationCandidateList = compensationCandidates
        .reduce((solutions: CompensationCandidate[], candidate) => {
          if (
            !candidate.contraction.isConflicting(
              contractionCandidate.contraction,
            ) &&
            contractionCandidate.area <= candidate.area
          )
            solutions.push({
              contraction: candidate.contraction,
              distance:
                contractionCandidate.contraction.configuration.innerEdge.getMinimalCycleDistance(
                  candidate.contraction.configuration.innerEdge,
                ),
            });
          return solutions;
        }, [])
        .sort((a, b) => a.distance - b.distance);
      const compensationCandidate = compensationCandidateList[0];
      if (compensationCandidate) {
        contraction = contractionCandidate.contraction;
        compensation = compensationCandidate.contraction;
        break;
      }
    }

    if (contraction && compensation)
      return new ConfigurationPair(contraction, compensation);
  }
}

export default FaceFaceBoundary;
