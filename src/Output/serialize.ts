import type Subdivision from "../geometry/Subdivision";
import type { Crs } from "../Input/Crs";
import type { SqlJsConfig } from "sql.js";
import { subdivisionToFlatGeobuf } from "./flatGeobuf";
import { canExportGeoJson, subdivisionToGeoJson } from "./geoJson";
import { subdivisionToGeoPackage } from "./geoPackage";
import { subdivisionToSvg } from "./svg";
import type { OutputFormat } from ".";

/** The file extension each output format is written with. */
export const outputExtensions = {
  gpkg: "gpkg",
  fgb: "fgb",
  geojson: "geojson",
  svg: "svg",
} satisfies Record<OutputFormat, string>;

/**
 * Pick the output format an extension names.
 * @param extension the extension, with or without its leading dot
 * @returns the format, or undefined if none writes that extension
 */
export const outputFormatOf = (extension: string): OutputFormat | undefined => {
  const lower = extension.toLowerCase().replace(/^\./, "");
  // `.json` is accepted for GeoJSON, as the readers accept it.
  if (lower === "json") return "geojson";
  return (Object.keys(outputExtensions) as OutputFormat[]).find(
    (format) => outputExtensions[format] === lower,
  );
};

export type SerializeOptions = {
  /** The CRS the coordinates are defined in, kept by the georeferenced formats. */
  crs?: Crs;
  /** Name of the GeoPackage's feature table. */
  layerName?: string;
  /** Passed to sql.js, notably `locateFile` for its wasm. */
  config?: SqlJsConfig;
};

/**
 * Serialize a {@link Subdivision} in one of the output formats.
 *
 * The single entry point for every writer, whatever the caller does with the
 * bytes afterwards — hand them to the browser as a download, or write them to
 * disk. GeoJSON is refused for anything but WGS84, as RFC 7946 requires.
 * @param subdivision the geometry to write
 * @param format the format to write it in
 * @param options the CRS to declare, the GeoPackage layer name and the sql.js config
 * @returns the file's contents
 */
export const serializeSubdivision = async (
  subdivision: Subdivision,
  format: OutputFormat,
  { crs, layerName = "schematization", config }: SerializeOptions = {},
): Promise<string | Uint8Array> => {
  switch (format) {
    case "gpkg":
      return await subdivisionToGeoPackage(subdivision, {
        crs,
        layerName,
        config,
      });
    case "fgb":
      return subdivisionToFlatGeobuf(subdivision, crs);
    case "geojson":
      if (!canExportGeoJson(crs))
        throw new Error(
          "GeoJSON coordinates are WGS84 by definition (RFC 7946), so projected data cannot be written to it.",
        );
      return JSON.stringify(subdivisionToGeoJson(subdivision));
    case "svg":
      return subdivisionToSvg(subdivision);
  }
};
