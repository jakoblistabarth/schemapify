import { GeoJsonProperties } from "geojson";
import Polygon from "./Polygon";

/**
 * Class representing a 2-dimensional multipolygon.
 * It is defined by its {@link Polygon}s.
 */
class MultiPolygon {
  /**
   * An array of {@link Polygon}s.
   */
  polygons: Polygon[];
  id?: string;
  properties?: GeoJsonProperties;

  constructor(
    polygons: Polygon[],
    id?: string,
    properties?: GeoJsonProperties,
  ) {
    (this.id = id), (this.polygons = polygons);
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
  static fromCoordinates(coordinates: [number, number][][][]) {
    return new MultiPolygon(
      coordinates.map((polygon) => Polygon.fromCoordinates(polygon)),
    );
  }
}

export default MultiPolygon;
