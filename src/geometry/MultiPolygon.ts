import { GeoJsonProperties } from "geojson";
import Polygon, { type PolygonCoordinates } from "./Polygon";

/** A multipolygon's polygons as plain coordinates. */
export type MultiPolygonCoordinates = PolygonCoordinates[];

/**
 * A multipolygon reduced to plain data, so that it survives structured cloning
 * (which drops class prototypes).
 */
export type SerializedMultiPolygon = {
  id?: number | string;
  properties?: GeoJsonProperties;
  coordinates: MultiPolygonCoordinates;
};

/**
 * Class representing a 2-dimensional multipolygon.
 * It is defined by its {@link Polygon}s.
 */
class MultiPolygon {
  /**
   * An array of {@link Polygon}s.
   */
  polygons: Polygon[];
  id?: number | string;
  properties?: GeoJsonProperties;

  constructor(
    polygons: Polygon[],
    id?: number | string,
    properties?: GeoJsonProperties,
  ) {
    this.id = id;
    this.polygons = polygons;
    this.properties = properties;
  }

  /**
   * Get the multipolygon's area.
   */
  get area() {
    return this.polygons.reduce((acc: number, d) => (acc += d.area), 0);
  }

  /**
   * Create a multipolygon from an array of coordinates.
   * @param coordinates An array of coordinates.
   * @returns A new MultiPolygon.
   */
  static fromCoordinates(coordinates: MultiPolygonCoordinates) {
    return new MultiPolygon(
      coordinates.map((polygon) => Polygon.fromCoordinates(polygon)),
    );
  }

  /**
   * Reduce the multipolygon to plain coordinates, the inverse of {@link MultiPolygon.fromCoordinates}.
   * Note that this drops the multipolygon's id and properties, use {@link MultiPolygon#toSerialized} to keep them.
   * @returns The multipolygon's polygons as coordinates.
   */
  toCoordinates(): MultiPolygonCoordinates {
    return this.polygons.map((polygon) => polygon.toCoordinates());
  }

  /**
   * Reduce the multipolygon, including its feature metadata, to plain data.
   * @returns The multipolygon as structured-cloneable data.
   */
  toSerialized(): SerializedMultiPolygon {
    return {
      id: this.id,
      properties: this.properties,
      coordinates: this.toCoordinates(),
    };
  }

  /**
   * Rebuild a multipolygon from its serialized form.
   * @param serialized The output of {@link MultiPolygon#toSerialized}.
   * @returns The restored multipolygon.
   */
  static fromSerialized({
    id,
    properties,
    coordinates,
  }: SerializedMultiPolygon) {
    return new MultiPolygon(
      coordinates.map((polygon) => Polygon.fromCoordinates(polygon)),
      id,
      properties,
    );
  }
}

export default MultiPolygon;
