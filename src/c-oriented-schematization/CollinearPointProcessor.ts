import Dcel from "../Dcel/Dcel";
import Processor from "../Schematization/Processor";

class CollinearPointProcessor implements Processor {
  public run(input: Dcel): Dcel {
    return this.removeSuperfluousVertices(input);
  }

  /**
   * Removes all vertices of the DCEL which are collinear, hence superfluous:
   * they can be removed without changing the visual geometry of the DCEL.
   * @param input The DCEL to remove superfluous vertices from.
   * @returns The DCEL with superfluous vertices removed.
   */
  private removeSuperfluousVertices(input: Dcel) {
    const output = input.clone();
    const superfluousVertices = output.getVertices().filter((v) => {
      if (v.edges.length != 2) return false;
      const angle = v.edges
        .map((h) => h.getAngle() ?? Infinity)
        .reduce((acc, h) => Math.abs(acc - h), 0);
      // QUESTION: how to deal with precision for trigonometry in general?
      const hasOpposingEdges = Math.abs(Math.PI - angle) < 0.00000001;
      return hasOpposingEdges;
    });
    superfluousVertices.forEach((v) => v.remove());
    return output;
  }
}

export default CollinearPointProcessor;
