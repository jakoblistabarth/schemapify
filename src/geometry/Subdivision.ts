import Dcel from "@/src/Dcel/Dcel";
import MultiPolygon from "./MultiPolygon";

export type Coordinates = [number, number][][][][];

/**
 * Represents a subdivision.
 * A subdivision is a collection of {@link MultiPolygon}s.
 */
class Subdivision {
  multiPolygons: MultiPolygon[];

  constructor(multiPolygons: MultiPolygon[]) {
    this.multiPolygons = multiPolygons;
  }

  /**
   * Create a {@link Subdivision} from a {@link Dcel}.
   * @param dcel A {@link Dcel} representing the subdivision.
   * @returns A {@link Subdivision}.
   */
  static fromDcel(dcel: Dcel) {
    return dcel.toSubdivision();
  }

  /**
   * Create a {@link Subdivision} from a list of coordinates.
   * @param coordinates A list of coordinates representing the subdivision.
   * @returns A {@link Subdivision}.
   */
  static fromCoordinates(coordinates: Coordinates) {
    const multiPolygons = coordinates.map((multiPolygon) =>
      MultiPolygon.fromCoordinates(multiPolygon),
    );
    return new this(multiPolygons);
  }

  /**
   * The subdivision's vertex count, excluding the repeated closing point
   * each {@link Ring} stores.
   */
  get vertexCount() {
    return this.multiPolygons.reduce(
      (sum, multiPolygon) =>
        sum +
        multiPolygon.polygons.reduce(
          (polygonSum, polygon) =>
            polygonSum +
            polygon.rings.reduce(
              (ringSum, ring) => ringSum + ring.length - 1,
              0,
            ),
          0,
        ),
      0,
    );
  }

  /**
   * Transform the subdivision into a {@link Dcel}.
   * @returns {@link Dcel} representation of the subdivision.
   */
  toDcel() {
    return Dcel.fromSubdivision(this);
  }
}

export default Subdivision;
