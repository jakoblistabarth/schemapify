export { subdivisionToFlatGeobuf } from "./flatGeobuf";
export { canExportGeoJson, subdivisionToGeoJson } from "./geoJson";
export { subdivisionToGeoPackage } from "./geoPackage";
export type { GeoPackageOptions } from "./geoPackage";
export { subdivisionToSvg } from "./svg";
export type { SvgOptions } from "./svg";

/** The formats a schematization can be exported to. */
export type OutputFormat = "gpkg" | "fgb" | "geojson" | "svg";

export {
  outputExtensions,
  outputFormatOf,
  serializeSubdivision,
} from "./serialize";
export type { SerializeOptions } from "./serialize";
