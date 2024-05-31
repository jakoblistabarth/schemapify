import Dcel from "../Dcel/Dcel";

abstract class Classifier {
  constructor() {}

  public abstract run(input: Dcel): Map<string, object | string> | string[];
}

export default Classifier;
