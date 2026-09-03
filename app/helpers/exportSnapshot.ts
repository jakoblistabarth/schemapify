import type Subdivision from "@/src/geometry/Subdivision";
import type { Crs } from "@/src/Input/Crs";
import {
  subdivisionToFlatGeobuf,
  subdivisionToGeoJson,
  subdivisionToGeoPackage,
  subdivisionToSvg,
  type OutputFormat,
} from "@/src/Output";
import sqlJsConfig from "./sqlJsConfig";

/**
 * What an export is for, which is the distinction that decides the format:
 * whether the file is going back into a GIS or on to a drawing board.
 */
export type OutputGroup = "geodata" | "graphics";

/** The groups in the order they are offered, with a note on what each is for. */
export const outputGroups = {
  geodata: { label: "Geodata", hint: "keeps the coordinate reference system" },
  graphics: { label: "Graphics", hint: "for vector software" },
} satisfies Record<OutputGroup, { label: string; hint: string }>;

/** How each format names itself, and which group it belongs to. */
export const outputFormats = {
  gpkg: { label: "GeoPackage", extension: "gpkg", group: "geodata" },
  fgb: { label: "FlatGeobuf", extension: "fgb", group: "geodata" },
  geojson: { label: "GeoJSON", extension: "geojson", group: "geodata" },
  svg: { label: "SVG", extension: "svg", group: "graphics" },
} satisfies Record<
  OutputFormat,
  { label: string; extension: string; group: OutputGroup }
>;

/** The formats of one group, in the order they are declared. */
export const formatsOf = (group: OutputGroup) =>
  (Object.keys(outputFormats) as OutputFormat[]).filter(
    (format) => outputFormats[format].group === group,
  );

/**
 * Strip a source file's extension, so the export is named after the data
 * rather than after the format it happened to arrive in.
 * @param name the source's file name
 * @returns the name without its extension
 */
const baseName = (name: string) =>
  name.replace(/\.subdivision\.json$/i, "").replace(/\.[^.]+$/, "");

/**
 * Serialize a subdivision into a downloadable file.
 * @param subdivision the geometry to write, typically the active snapshot's
 * @param format the format to write it in
 * @param options the source's name and CRS, used for the file name and for the
 * CRS the georeferenced formats declare
 * @returns the file's contents and the name to save it under
 */
export const toExportFile = async (
  subdivision: Subdivision,
  format: OutputFormat,
  { name, crs }: { name: string; crs?: Crs },
) => {
  const fileName = `${baseName(name)}-schematized.${outputFormats[format].extension}`;
  if (format === "svg")
    return {
      fileName,
      blob: new Blob([subdivisionToSvg(subdivision)], {
        type: "image/svg+xml",
      }),
    };
  if (format === "geojson")
    return {
      fileName,
      blob: new Blob([JSON.stringify(subdivisionToGeoJson(subdivision))], {
        type: "application/geo+json",
      }),
    };
  if (format === "fgb")
    return {
      fileName,
      // Copied into a fresh buffer, as for the GeoPackage below.
      blob: new Blob(
        [new Uint8Array(subdivisionToFlatGeobuf(subdivision, crs))],
        {
          type: "application/vnd.flatgeobuf",
        },
      ),
    };
  const bytes = await subdivisionToGeoPackage(subdivision, {
    crs,
    layerName: baseName(name).replace(/\W/g, "_") || "schematization",
    config: sqlJsConfig,
  });
  return {
    fileName,
    // Copied into a fresh buffer: sql.js exports a view into its wasm memory.
    blob: new Blob([new Uint8Array(bytes)], {
      type: "application/geopackage+sqlite3",
    }),
  };
};

/**
 * Hand a blob to the browser as a download.
 * @param blob the file's contents
 * @param fileName the name to save it under
 */
export const download = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};
