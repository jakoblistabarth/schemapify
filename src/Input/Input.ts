import Dcel from "@/src/Dcel/Dcel";
import { Polygon, MultiPolygon, FeatureCollection } from "geojson";
import { geoJsonToGeometry } from "../utilities";
import Subdivision from "../geometry/Subdivision";

/**
 * Represents the input data for the schematization process.
 */
class Input {
  name: string;
  data: Subdivision;
  format: "shp" | "json" | "kml";

  constructor(name: string, data: Subdivision, format: "shp" | "json" | "kml") {
    this.name = name;
    this.data = data;
    this.format = format;
  }

  static fromGeoJSON(json: FeatureCollection<MultiPolygon | Polygon>): Input {
    return new this("geojson", geoJsonToGeometry(json), "json");
  }
  // TODO: Implement method to create Input from file path
  //   static from(filePath: string): Input {
  //     // do something
  //     return new this(filePath, new Subdivision(), "json");
  //   }

  /**
   * Get the input data as Dcel.
   * @returns {@link Dcel} representation of the input data.
   */
  getDcel(): Dcel {
    return this.data.toDcel();
  }
}

export default Input;
