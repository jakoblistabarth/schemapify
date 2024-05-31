import { CStyle } from "./schematization.style";

class StaircaseProcessor {
  public addStaircases(
    vertexMap: Map<string, any>,
    HalfEdgeMap: Map<string, any>,
    style: CStyle,
  ) {
    this.caclulateStaircase();
    this.replaceEdgesWithStaircases();
  }

  private caclulateStaircase() {}
  private replaceEdgesWithStaircases() {}
}

export default StaircaseProcessor;
