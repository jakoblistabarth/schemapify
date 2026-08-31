import Dcel from "@/src/Dcel/Dcel";
import BoundingBox from "../helpers/BoundingBox";
import MultiPolygon, {
  type MultiPolygonCoordinates,
  type SerializedMultiPolygon,
} from "./MultiPolygon";

export type Coordinates = MultiPolygonCoordinates[];
export type SerializedSubdivision = { multiPolygons: SerializedMultiPolygon[] };

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
   * Reduce the subdivision to plain coordinates, the inverse of {@link Subdivision.fromCoordinates}.
   * Note that this drops the multipolygons' feature metadata, use {@link Subdivision#toSerialized} to keep it.
   * @returns The subdivision's multipolygons as coordinates.
   */
  toCoordinates(): Coordinates {
    return this.multiPolygons.map((multiPolygon) =>
      multiPolygon.toCoordinates(),
    );
  }

  /**
   * Reduce the subdivision, including its feature metadata, to plain data.
   * @returns The subdivision as structured-cloneable data.
   */
  toSerialized(): SerializedSubdivision {
    return {
      multiPolygons: this.multiPolygons.map((multiPolygon) =>
        multiPolygon.toSerialized(),
      ),
    };
  }

  /**
   * Rebuild a subdivision from its serialized form.
   * @param serialized The output of {@link Subdivision#toSerialized}.
   * @returns The restored subdivision.
   */
  static fromSerialized({ multiPolygons }: SerializedSubdivision) {
    return new Subdivision(multiPolygons.map(MultiPolygon.fromSerialized));
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
   * The subdivision's bounding box.
   * @returns A {@link BoundingBox} enclosing all of the subdivision's points.
   */
  getBbox() {
    return new BoundingBox(this.toCoordinates().flat(2).flat());
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
