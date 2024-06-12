import Dcel from "../Dcel/Dcel";
import Processor from "../Schematization/Processor";
import Configuration from "./Configuration";
import FaceFaceBoundaryList from "./FaceFaceBoundaryList";

class EdgeMoveProcessor implements Processor {
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
    const edgeMove = pair?.doEdgeMove(
      input,
      this.contractions,
      this.configurations,
    );
    return edgeMove
      ? {
          dcel: edgeMove.dcel,
          configurations: edgeMove.configurations,
          contractions: edgeMove.contractions,
        }
      : undefined;
  }

  get contractions() {
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
