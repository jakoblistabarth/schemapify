import HalfEdge from "../DCEL/HalfEdge";
import Face from "../DCEL/Face";
import Contraction from "./Contraction";

class FaceFaceBoundary {
  faces: [Face, Face];
  edges: HalfEdge[];

  constructor(faceA: Face, faceB: Face, edge: HalfEdge) {
    this.faces = [faceA, faceB];
    this.edges = [edge];
  }

  getMinimalConfigurationPair(): [Contraction, Contraction] | undefined {
    const contractions = this.edges.reduce((contractions: Contraction[], edge) => {
      const smaller = edge.configuration?.getSmallerContraction();
      if (smaller && smaller.isFeasible()) contractions.push(smaller);
      return contractions;
    }, []);
    contractions.sort((a, b) => a.area - b.area);

    let idx = 0;
    let complementary: Contraction | undefined;
    do {
      const complementaries = contractions.filter((c) => c.isComplementary(contractions[idx]));
      complementary = complementaries.reduce((solution: Contraction | undefined, candidate) => {
        if (
          !candidate.isConflicting(contractions[idx]) &&
          (!solution || candidate.area < solution.area)
        )
          return (solution = candidate);
        return solution;
      }, undefined);
    } while (!complementary && idx > contractions.length);

    return contractions[idx] && complementary ? [contractions[idx], complementary] : undefined;
  }
}

export default FaceFaceBoundary;
