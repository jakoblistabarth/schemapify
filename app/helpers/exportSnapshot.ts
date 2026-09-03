import type Subdivision from "@/src/geometry/Subdivision";
import type { Crs } from "@/src/Input/Crs";
import {
  outputExtensions,
  serializeSubdivision,
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
  gpkg: { label: "GeoPackage", group: "geodata" },
  fgb: { label: "FlatGeobuf", group: "geodata" },
  geojson: { label: "GeoJSON", group: "geodata" },
  svg: { label: "SVG", group: "graphics" },
} satisfies Record<OutputFormat, { label: string; group: OutputGroup }>;

/** The MIME type each format is handed to the browser as. */
const mimeTypes = {
  gpkg: "application/geopackage+sqlite3",
  fgb: "application/vnd.flatgeobuf",
  geojson: "application/geo+json",
  svg: "image/svg+xml",
} satisfies Record<OutputFormat, string>;

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
  const contents = await serializeSubdivision(subdivision, format, {
    crs,
    layerName: baseName(name).replace(/\W/g, "_") || "schematization",
    config: sqlJsConfig,
  });
  return {
    fileName: `${baseName(name)}-schematized.${outputExtensions[format]}`,
    // The binary writers return a view into wasm memory, so the bytes are
    // copied into a fresh buffer before the blob takes them.
    blob: new Blob(
      [typeof contents === "string" ? contents : new Uint8Array(contents)],
      { type: mimeTypes[format] },
    ),
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
