import Dcel from "../Dcel/Dcel";
import FaceFaceBoundaryList from "../c-oriented-schematization/FaceFaceBoundaryList";

abstract class Generator {
  constructor() {}

  public abstract run(
    input: Dcel,
  ): Map<string | number, object | string> | number[] | FaceFaceBoundaryList;
}

export default Generator;
