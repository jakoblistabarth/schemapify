import Dcel from "../Dcel/Dcel";

abstract class Processor {
  constructor() {}

  public abstract run(input: Dcel): Dcel;
}

export default Processor;
