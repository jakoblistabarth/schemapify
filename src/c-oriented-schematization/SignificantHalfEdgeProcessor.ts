import Dcel from "../Dcel/Dcel";
import Processor from "../Schematization/Processor";

class SignificantHalfEdgeProcessor implements Processor {
  significantVertices: string[];

  constructor(significantVertices: string[]) {
    this.significantVertices = significantVertices;
  }

  /**
   * Subdivides all HalfEdges which both endpoints are significant.
   * @param input The DCEL to process.
   * @returns The processed DCEL.
   */
  public run(input: Dcel): Dcel {
    const output = input.clone();
    output.getHalfEdges(true).forEach((edge) => {
      const [tail, head] = edge.endpoints;
      if (
        this.significantVertices.includes(tail.uuid) &&
        this.significantVertices.includes(head.uuid)
      )
        edge.subdivide();
    });
    return output;
  }
}

export default SignificantHalfEdgeProcessor;
