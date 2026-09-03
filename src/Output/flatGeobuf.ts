import { geojson } from "flatgeobuf";
import type Subdivision from "../geometry/Subdivision";
import type { Crs } from "../Input/Crs";
import { subdivisionToGeoJson } from "./geoJson";

/**
 * Write a {@link Subdivision} as a FlatGeobuf file.
 *
 * The GeoJSON structure is only the shape the serializer takes; the file
 * itself records the CRS code in its header, so — unlike a `.geojson` file —
 * projected coordinates stay correctly georeferenced.
 * @param subdivision the subdivision to write
 * @param crs the CRS the coordinates are defined in, if known
 * @returns the contents of a `.fgb` file
 */
export const subdivisionToFlatGeobuf = (
  subdivision: Subdivision,
  crs?: Crs,
) => {
  // The serializer's own default for "no CRS declared".
  const code = crs?.org === "EPSG" ? (crs.code ?? 0) : 0;
  return geojson.serialize(subdivisionToGeoJson(subdivision), code);
};
