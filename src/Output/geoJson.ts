import type { Feature, MultiPolygon as GeoJsonMultiPolygon } from "geojson";
import type Subdivision from "../geometry/Subdivision";
import { isWgs84 } from "../Input/Crs";
import type { Crs } from "../Input/Crs";
import { createGeoJSON } from "../utilities";
import { toWoundRings } from "./rings";

/**
 * Convert a {@link Subdivision} to a GeoJSON feature collection.
 *
 * Every multipolygon becomes one MultiPolygon feature, keeping its id and
 * properties. RFC 7946 defines GeoJSON coordinates as WGS84, so this is only
 * meaningful for data in that CRS — see {@link canExportGeoJson}.
 * @param subdivision the subdivision to convert
 * @returns the feature collection
 */
export const subdivisionToGeoJson = (subdivision: Subdivision) =>
  createGeoJSON(
    subdivision.multiPolygons.map(
      (multiPolygon, index): Feature<GeoJsonMultiPolygon> => ({
        type: "Feature",
        id: multiPolygon.id ?? index,
        properties: multiPolygon.properties ?? {},
        geometry: {
          type: "MultiPolygon",
          coordinates: multiPolygon.polygons.map(toWoundRings),
        },
      }),
    ),
  );

/**
 * Whether a {@link Subdivision} in the given CRS may be written as GeoJSON.
 * Projected coordinates would be silently mislabelled as WGS84, so they are
 * refused rather than exported.
 * @param crs the CRS the data is defined in, if known
 * @returns whether GeoJSON is a faithful representation
 */
export const canExportGeoJson = (crs?: Crs) => isWgs84(crs);
