import Dcel from "../Dcel/Dcel";
// import Processor from "../Schematization/Processor";
import Configuration from "./Configuration";
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
    const pair = this.faceFaceBoundaryList.getMinimalConfigurationPair(
      this.configurations,
    );
    // Contractions and configurations are updated as side effects in doEdgeMove()
    const edgeMove = pair?.doEdgeMove(
      input,
      this.contractions,
      this.configurations,
    );
    return {
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
