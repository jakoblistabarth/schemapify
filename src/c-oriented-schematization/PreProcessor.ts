import Dcel from "../Dcel/Dcel";
import HalfEdge from "../Dcel/HalfEdge";
import Processor from "../Schematization/Processor";

class PreProcessor implements Processor {
  epsilon: number;
  constructor(epsilon: number) {
    this.epsilon = epsilon;
  }

  public run(input: Dcel) {
    return this.subdivideEdges(input, this.epsilon);
  }

  /**
   * Subdivide all edges of an DCEL so that no edges are longer than the defined threshold.
   * @param Dcel The DCEL to subdivide.
   * @param threshold The maximum length of an edge.
   * @returns A subdivided {@link Dcel}.
   */
  private subdivideEdges(input: Dcel, threshold: number) {
    input.getBoundedFaces().forEach((f) => {
      const edges = f.getEdges();
      if (!edges) return;
      edges.forEach((e) => {
        this.subdivideToThreshold(e, threshold);
      });
    });
    return input;
  }

  /**
   * Subdivides the HalfEdge into smaller Edges, using a threshold.
   * @param halfEdge The {@link HalfEdge} to subdivide.
   * @param threshold The value determining the maximum length of a subdivision of the original {@link HalfEdge}.
   */
  private subdivideToThreshold(halfEdge: HalfEdge, threshold: number) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const initialHalfEdge: HalfEdge = halfEdge;
    let currentHalfEdge: HalfEdge = initialHalfEdge;

    while (currentHalfEdge != initialHalfEdge.next) {
      const length = currentHalfEdge.getLength();
      if (
        currentHalfEdge.next &&
        typeof length === "number" &&
        length < threshold
      ) {
        currentHalfEdge = currentHalfEdge.next;
      } else {
        const newHalfEdge = currentHalfEdge.subdivide();
        currentHalfEdge =
          newHalfEdge ?? currentHalfEdge.next ?? initialHalfEdge;
      }
    }
  }
}

export default PreProcessor;
