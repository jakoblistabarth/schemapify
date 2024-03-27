import { GeoJsonProperties } from "geojson";
import Polygon from "./Polygon";

/**
 * Class representing a 2-dimensional multipolygon.
 * It is defined by its polygons.
 */
class MultiPolygon {
  /**
   * An array of {@links Polygon}s.
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

  get area() {
    return this.polygons.reduce((acc: number, d) => (acc += d.area), 0);
  }

  static fromCoordinates(coordinates: [number, number][][][]) {
    return new MultiPolygon(
      coordinates.map((polygon) => Polygon.fromCoordinates(polygon)),
    );
  }
}

export default MultiPolygon;
