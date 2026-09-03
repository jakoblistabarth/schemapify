import Dcel from "../Dcel/Dcel";
// import Processor from "../Schematization/Processor";
import Configuration from "./Configuration";
import Contraction from "./Contraction";
import FaceFaceBoundaryList from "./FaceFaceBoundaryList";

//TO-DO: make this class more in line with the other processors?
// Class EdgeMoveProcessor implements Processor {
class EdgeMoveProcessor {
  faceFaceBoundaryList: FaceFaceBoundaryList;
  configurations: Map<string, Configuration>;

  constructor(
    faceFaceBoundaryList: FaceFaceBoundaryList,
    configurations: Map<string, Configuration>,
  ) {
    this.faceFaceBoundaryList = faceFaceBoundaryList;
    this.configurations = configurations;
  }

  // TO-DO: the return type here is wrong,
  // the edge move is perhaps the combination of a processor and a generator?
  public run(input: Dcel) {
    // A pair whose move declines leaves the Dcel as it found it, so the next one is
    // taken in its place. Only a move which gives up half way is a defect, and one
    // reports that by throwing rather than by declining.
    const passedOver = new Set<Contraction>();
    let pair = this.faceFaceBoundaryList.getMinimalConfigurationPair(
      this.configurations,
      passedOver,
    );
    let edgeMove;
    while (pair) {
      // A pair which sheds no edge is not permitted, however small its contraction
      // area: it leaves the Dcel no simpler than it found it, and two such pairs can
      // undo one another and repeat for ever. Checked before the move rather than
      // after, since a move cannot be taken back once the Dcel carries it.
      if (pair.complexityReduction > 0) {
        // Contractions and configurations are updated as side effects in doEdgeMove()
        edgeMove = pair.doEdgeMove(
          input,
          this.contractions,
          this.configurations,
        );
        if (edgeMove) break;
      }
      passedOver.add(pair.contraction);
      pair = this.faceFaceBoundaryList.getMinimalConfigurationPair(
        this.configurations,
        passedOver,
      );
    }
    return {
      // Without a feasible pair nothing is left to simplify, which callers need to
      // know before they treat the untouched Dcel as the result of a move. A pair
      // which then fails to move is a different matter: it leaves the Dcel half
      // moved, so the two cannot be reported as one.
      hasPair: !!pair,
      hasMoved: !!edgeMove,
      dcel: edgeMove ? edgeMove.dcel : input,
      configurations: edgeMove ? edgeMove.configurations : this.configurations,
      faceFaceBoundaryList: edgeMove
        ? //TO-DO: update the face-face-boundary-list as its creation(?) is expensive O(n^2)?
          new FaceFaceBoundaryList(edgeMove.dcel)
        : this.faceFaceBoundaryList,
    };
  }

  private get contractions() {
    return new Map(
      Array.from(this.configurations.entries()).map(
        ([edgeId, configuration]) => {
          return [edgeId, configuration.contractions];
        },
      ),
    );
  }
}

export default EdgeMoveProcessor;
