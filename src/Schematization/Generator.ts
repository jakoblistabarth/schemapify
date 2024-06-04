import Dcel from "../Dcel/Dcel";

abstract class Generator {
  constructor() {}

  public abstract run(input: Dcel): Map<string, object | string> | string[];
}

export default Generator;
