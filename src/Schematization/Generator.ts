import Dcel from "../Dcel/Dcel";
import FaceFaceBoundaryList from "../c-oriented-schematization/FaceFaceBoundaryList";

abstract class Generator {
  constructor() {}

  public abstract run(
    input: Dcel,
  ): Map<string, object | string> | string[] | FaceFaceBoundaryList;
}

export default Generator;
