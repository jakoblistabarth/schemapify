import Dcel from "../Dcel/Dcel";
// import Processor from "../Schematization/Processor";
import Configuration from "./Configuration";
import FaceFaceBoundaryList from "./FaceFaceBoundaryList";

//TODO: make this class more in line with the other processors?
// class EdgeMoveProcessor implements Processor {
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

  // TODO: the return type here is wrong,
  // the edge move is perhaps the combination of a processor and a generator?
  public run(input: Dcel) {
    const pair = this.faceFaceBoundaryList.getMinimalConfigurationPair(
      this.configurations,
    );
    // contractions and configurations are updated as side effects in doEdgeMove()
    const edgeMove = pair?.doEdgeMove(
      input,
      this.contractions,
      this.configurations,
    );
    return {
      dcel: edgeMove ? edgeMove.dcel : input,
      configurations: edgeMove ? edgeMove.configurations : this.configurations,
      faceFaceBoundaryList: edgeMove
        ? //TODO: update the ffbl as its creation(?) is expensive O(n^2)?
          new FaceFaceBoundaryList(edgeMove.dcel)
        : this.faceFaceBoundaryList,
    };
  }

  private get contractions() {
    return new Map(
      Array.from(this.configurations.entries()).map(
        ([edgeUuid, configuration]) => {
          return [edgeUuid, configuration.contractions];
        },
      ),
    );
  }
}

export default EdgeMoveProcessor;
