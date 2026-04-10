import Dcel from "@/src/Dcel/Dcel";
import MultiPolygon from "./MultiPolygon";

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
  static fromCoordinates(coordinates: [number, number][][][][]) {
    const multiPolygons = coordinates.map((multiPolygon) =>
      MultiPolygon.fromCoordinates(multiPolygon),
    );
    return new this(multiPolygons);
  }

  /**
   * Transform the subdivision into a {@link Dcel}.
   * @returns {@link Dcel} representation of the subdivision.
   */
  toDcel() {
    return Dcel.fromSubdivision(this);
  }

  /**
   * Transform the subdivision into an array of multi polygons (represented by arrays).
   * @returns An array of multi polygons (serialized into arrays).
   */
  toMultiPolygons() {
    return this.multiPolygons.map((multiPolygon) => {
      const { properties, polygons } = multiPolygon;
      const coordinates = polygons.map((polygon) =>
        polygon.rings.map((ring) => ring.points.map((point) => point.xy)),
      );
      return {
        properties,
        coordinates,
      };
    });
  }
}

export default Subdivision;
