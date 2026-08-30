import Dcel from "@/src/Dcel/Dcel";
import { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import Subdivision from "../geometry/Subdivision";
import { geoJsonToGeometry } from "../utilities";
import { Crs, wgs84 } from "./Crs";
import { flatGeobufToGeometry } from "./flatGeobuf";
import { geoPackageToGeometry } from "./geoPackage";
import type { SqlJsConfig } from "sql.js";

export type InputFormat =
  | "shp"
  | "json"
  | "kml"
  | "coordinates"
  | "fgb"
  | "gpkg";

/**
 * Represents the input data for the schematization process.
 */
class Input {
  name: string;
  data: Subdivision;
  format: InputFormat;
  /**
   * The coordinate reference system the data is defined in, where the source
   * format declares one.
   */
  crs?: Crs;

  constructor(name: string, data: Subdivision, format: InputFormat, crs?: Crs) {
    this.name = name;
    this.data = data;
    this.format = format;
    this.crs = crs;
  }

  static fromCoordinates(name: string, coordinates: [number, number][][][][]) {
    return new this(
      name,
      Subdivision.fromCoordinates(coordinates),
      "coordinates",
    );
  }

  static fromGeoJSON(
    json: FeatureCollection<MultiPolygon | Polygon>,
    name = "geojson",
  ): Input {
    // GeoJSON coordinates are WGS84 by definition (RFC 7946).
    return new this(name, geoJsonToGeometry(json), "json", wgs84);
  }

  /**
   * Create an {@link Input} from a FlatGeobuf file.
   * @param name the file's name
   * @param bytes the contents of the `.fgb` file
   * @returns an {@link Input} carrying the file's CRS
   */
  static async fromFlatGeobuf(name: string, bytes: Uint8Array): Promise<Input> {
    const { data, crs } = await flatGeobufToGeometry(bytes);
    return new this(name, data, "fgb", crs);
  }

  /**
   * Create an {@link Input} from a GeoPackage file.
   * @param name the file's name
   * @param bytes the contents of the `.gpkg` file
   * @param config passed to sql.js, notably `locateFile` for its wasm
   * @returns an {@link Input} carrying the file's CRS
   */
  static async fromGeoPackage(
    name: string,
    bytes: Uint8Array,
    config?: SqlJsConfig,
  ): Promise<Input> {
    const { data, crs } = await geoPackageToGeometry(bytes, config);
    return new this(name, data, "gpkg", crs);
  }

  /**
   * Get the input data as Dcel.
   * @returns {@link Dcel} representation of the input data.
   */
  getDcel(): Dcel {
    return this.data.toDcel();
  }
}

export default Input;
