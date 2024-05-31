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
    // input = input.clone(); TODO: clone is not possible because it regenerates the uuids? should I use keys based on the vertices positions?
    input.getHalfEdges(undefined, true).forEach((edge) => {
      const [tail, head] = edge.endpoints;
      if (
        this.significantVertices.includes(tail.uuid) &&
        this.significantVertices.includes(head.uuid)
      )
        edge.subdivide();
    });
    return input;
  }
}

export default SignificantHalfEdgeProcessor;
