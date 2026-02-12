import Dcel from "../Dcel/Dcel";
import Processor from "../Schematization/Processor";

class SignificantHalfEdgeProcessor implements Processor {
  significantVertices: number[];

  constructor(significantVertices: number[]) {
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
        tail.id !== undefined &&
        head.id !== undefined &&
        this.significantVertices.includes(tail.id) &&
        this.significantVertices.includes(head.id)
      )
        edge.subdivide();
    });
    return output;
  }
}

export default SignificantHalfEdgeProcessor;
