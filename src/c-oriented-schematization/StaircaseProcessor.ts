import Dcel from "../Dcel/Dcel";

class StaircaseProcessor {
  public run(input: Dcel) {
    this.caclulateStaircase();
    this.replaceEdgesWithStaircases();
    const output = input;
    return output;
  }

  private caclulateStaircase() {}
  private replaceEdgesWithStaircases() {}
}

export default StaircaseProcessor;
