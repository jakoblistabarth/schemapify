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
  getMinimalConfigurationPair(
    configurations: Map<string, Configuration>,
    passedOver: Set<Contraction> = new Set(),
  ) {
    /** A contraction paired with its area, which the sorts below would otherwise re-derive per comparison. */
    type Candidate = { contraction: Contraction; area: number };

    /**
     * Where each edge sits on the cycle around a given one, in both directions.
     *
     * Walking a cycle costs its whole length, and the distance below is wanted from
     * one inner edge to every candidate for its compensation, so each cycle is walked
     * once and looked up per candidate rather than walked again for each of them.
     */
    const cycles = new Map<
      HalfEdge,
      { forwards: Map<HalfEdge, number>; backwards: Map<HalfEdge, number> }
    >();
    const positionsAround = (edge: HalfEdge) => {
      const known = cycles.get(edge);
      if (known) return known;
      const positions = {
        forwards: new Map(edge.getCycle().map((e, index) => [e, index])),
        backwards: new Map(edge.getCycle(false).map((e, index) => [e, index])),
      };
      cycles.set(edge, positions);
      return positions;
    };
    /**
     * How far apart two inner edges are along the cycle they share.
     * @param from The contraction's inner edge.
     * @param to The compensation's inner edge.
     * @returns The smaller of the two distances around the cycle.
     */
    const minimalCycleDistance = (from: HalfEdge, to: HalfEdge) => {
      const { forwards, backwards } = positionsAround(from);
      // An edge on neither cycle counts as -1, as looking for its index reports it,
      // so that this stays the distance {@link HalfEdge.getMinimalCycleDistance} gives.
      return Math.min(forwards.get(to) ?? -1, backwards.get(to) ?? -1);
    };

    const feasibleContractions = (type: ContractionType) =>
      this.edges
        .reduce((candidates: Candidate[], edge) => {
          const configuration = edge.coordKey
            ? configurations.get(edge.coordKey)
            : undefined;
          const contraction = configuration?.[type];
          if (contraction?.isFeasible && !passedOver.has(contraction))
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
              distance: minimalCycleDistance(
                contractionCandidate.contraction.configuration.innerEdge,
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
