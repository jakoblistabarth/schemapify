import Dcel from "../Dcel/Dcel";
import Processor from "../Schematization/Processor";
import { isCollinearVertex } from "./VertexUtils";

class CollinearPointProcessor implements Processor {
  public run(input: Dcel): Dcel {
    return this.removeCollinearVertices(input);
  }

  /**
   * Removes all vertices of the DCEL which are collinear, hence superfluous:
   * they can be removed without changing the visual geometry of the DCEL.
   * @param input The DCEL to remove vertices from.
   * @returns The DCEL with respective vertices removed.
   */
  private removeCollinearVertices(input: Dcel) {
    const output = input.clone();
    // iteratively remove collinear vertices until none remain
    while (true) {
      const collinearVertices = output
        .getVertices()
        .filter((v) => isCollinearVertex(v));
      if (collinearVertices.length === 0) break;
      collinearVertices.forEach((v) => v.remove());
    }
    return output;
  }
}

export default CollinearPointProcessor;
