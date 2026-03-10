import Dcel from "../Dcel/Dcel";
import Vertex from "../Dcel/Vertex";
import Processor from "../Schematization/Processor";

class SignificantHalfEdgeProcessor implements Processor {
  significantVertices: number[];
  // TODO: should be a Set for better performance, but using Map because of Snapshot types
  private significantVertexKeys: Map<string, boolean> = new Map();

  constructor(significantVertices: number[]) {
    this.significantVertices = significantVertices;
  }

  /**
   * Subdivides all HalfEdges which both endpoints are significant.
   * Tracks significant vertices by their coordinate keys for stable identification after subdivision.
   * @param input The DCEL to process.
   * @returns The processed DCEL.
   */
  public run(input: Dcel): Dcel {
    const output = input.clone();
    this.significantVertexKeys.clear();

    // Track original significant vertices by coordinate key
    output.getVertices().forEach((vertex) => {
      if (
        typeof vertex.id === "number" &&
        vertex.id > 0 &&
        this.significantVertices.includes(vertex.id)
      ) {
        this.significantVertexKeys.set(Vertex.getKey(vertex.x, vertex.y), true);
      }
    });

    // Subdivide edges between significant vertices
    output.getHalfEdges(true).forEach((edge) => {
      const [tail, head] = edge.endpoints;
      if (
        typeof tail.id === "number" &&
        tail.id > 0 &&
        typeof head.id === "number" &&
        head.id > 0 &&
        this.significantVertices.includes(tail.id) &&
        this.significantVertices.includes(head.id)
      )
        edge.subdivide();
    });

    return output;
  }

  /**
   * Gets the set of significant vertex keys (coordinate-based) after processing.
   * @returns A Set of coordinate keys for vertices marked as significant.
   */
  public getSignificantVertexKeys() {
    return this.significantVertexKeys;
  }
}

export default SignificantHalfEdgeProcessor;
