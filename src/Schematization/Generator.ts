import FaceFaceBoundaryList from "../c-oriented-schematization/FaceFaceBoundaryList";
import Dcel from "../Dcel/Dcel";

abstract class Generator {
  constructor() {}

  public abstract run(
    input: Dcel,
  ): Map<string | number, object | string> | number[] | FaceFaceBoundaryList;
}

export default Generator;
