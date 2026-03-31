import Dcel from "../Dcel/Dcel";
import Generator from "../Schematization/Generator";
import Configuration from "./Configuration";

class ConfigurationGenerator implements Generator {
  public run(input: Dcel) {
    return this.generateConfigurations(input);
  }

  /**
   * Creates Configurations for all valid edges.
   * Uses coordKey (coordinate-based) instead of edge.id for stable identification
   * across moveTo operations that may change edge IDs.
   */
  private generateConfigurations(input: Dcel) {
    const configurations = input
      .getHalfEdges()
      .reduce<Map<string, Configuration>>((acc, edge) => {
        if (
          edge.endpoints.some((vertex) => vertex.edges.length > 3) ||
          !edge.coordKey
        ) {
          return acc;
        }
        acc.set(edge.coordKey, new Configuration(edge));
        return acc;
      }, new Map());

    configurations.forEach((configuration) => {
      //TO-DO: Check whether this works in such a recursive way
      configuration.initialize(configurations);
    });
    return configurations;
  }
}

export default ConfigurationGenerator;
