import Dcel from "../Dcel/Dcel";
import Processor from "../Schematization/Processor";
import Point from "../geometry/Point";
import Staircase from "./Staircase";

class StaircaseProcessor implements Processor {
  staircases: Map<string, Staircase>;

  constructor(staircases: Map<string, Staircase>) {
    this.staircases = staircases;
  }

  public run(input: Dcel) {
    this.replaceEdgesWithStaircases(input);
    const output = input;
    return output;
  }

  /**
   * Replace all edges of a {@link Dcel} with staircases.
   * @param input The {@link Dcel} to replace the edges with staircases in.
   */
  private replaceEdgesWithStaircases(input: Dcel) {
    input.getHalfEdges().forEach((edge) => {
      const staircase = this.staircases.get(edge.uuid);
      if (!staircase) return;
      const stepPoints = staircase.getStaircasePoints().slice(1, -1); // TODO: use .points instead
      let edgeToSubdivide = edge;
      for (const p of stepPoints) {
        const dividedEdge = edgeToSubdivide.subdivide(new Point(p.x, p.y));
        if (!dividedEdge) return;
        if (dividedEdge.next) edgeToSubdivide = dividedEdge.next;
      }
    });
  }
}

export default StaircaseProcessor;
