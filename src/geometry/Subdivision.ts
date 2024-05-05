import MultiPolygon from "./MultiPolygon";
import Dcel from "../Dcel/Dcel";

class Subdivision {
  multiPolygons: MultiPolygon[];

  constructor(multiPolygons: MultiPolygon[]) {
    this.multiPolygons = multiPolygons;
  }

  static fromDcel(dcel: Dcel): Subdivision {
    return dcel.toSubdivision();
  }

  static fromCoordinates(coordinates: [number, number][][][][]): Subdivision {
    const multiPolygons = coordinates.map((multiPolygon) =>
      MultiPolygon.fromCoordinates(multiPolygon),
    );
    return new this(multiPolygons);
  }

  toDcel(): Dcel {
    return Dcel.fromSubdivision(this);
  }
}

export default Subdivision;
