import Dcel from "../Dcel/Dcel";
import Generator from "../Schematization/Generator";
import Configuration from "./Configuration";

class ConfigurationGenerator implements Generator {
  public run(input: Dcel) {
    return this.generateConfigurations(input);
  }

  /**
   * Creates Configurations for all valid edges.
   */
  private generateConfigurations(input: Dcel) {
    const configurations = input
      .getHalfEdges()
      .reduce<Map<string, Configuration>>((acc, edge) => {
        if (edge.endpoints.every((vertex) => vertex.edges.length > 3))
          return acc;
        return acc.set(edge.uuid, new Configuration(edge));
      }, new Map());

    configurations.forEach((configuration) => {
      //TODO: Check whether this works in such a recursive way
      configuration.initialize(configurations);
    });

    return configurations;
  }
}

export default ConfigurationGenerator;
