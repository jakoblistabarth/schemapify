import Dcel from "../Dcel/Dcel";
import Generator from "../Schematization/Generator";
import FaceFaceBoundaryList from "./FaceFaceBoundaryList";

class FaceFaceBoundaryListGenerator implements Generator {
  public run(input: Dcel) {
    return new FaceFaceBoundaryList(input);
  }
}

export default FaceFaceBoundaryListGenerator;
