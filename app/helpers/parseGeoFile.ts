import { flatGeobufToGeometry } from "@/src/Input/flatGeobuf";
import { geoPackageToGeometry } from "@/src/Input/geoPackage";
import Input from "@/src/Input/Input";
import { validateGeoJSON } from "@/src/utilities";
import type { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { withBasePath } from "./basePath";

export type ParseResult =
  | {
      ok: true;
      input: Input;
      /** Vertex count, excluding the repeated closing point of each ring. */
      vertexCount: number;
      /** Number of features dropped because they are not areal. */
      skipped: number;
    }
  | { ok: false; error: string };

/**
 * Read a FlatGeobuf file.
 *
 * The binary is decoded straight into the geometry classes, so the file's
 * coordinate reference system is preserved on the {@link Input} rather than
 * being lost to GeoJSON's WGS84-only coordinates.
 */
const parseFlatGeobuf = async (
  name: string,
  bytes: Uint8Array,
): Promise<ParseResult> => {
  try {
    const { data, crs, skipped } = await flatGeobufToGeometry(bytes);
    if (data.multiPolygons.length === 0)
      return {
        ok: false,
        error:
          "No polygonal features found. Schematization requires Polygon or MultiPolygon geometry.",
      };
    return {
      ok: true,
      input: new Input(name, data, "fgb", crs),
      vertexCount: data.vertexCount,
      skipped,
    };
  } catch (error) {
    return {
      ok: false,
      error: `Could not read FlatGeobuf: ${error instanceof Error ? error.message : "unknown error"}`,
    };
  }
};

/**
 * sql.js resolves its wasm relative to the page, which fails in the browser.
 * `pnpm assets` copies the file into `public/`.
 */
const sqlJsConfig = { locateFile: () => withBasePath("/sql-wasm.wasm") };

/**
 * Read a GeoPackage file.
 *
 * Like FlatGeobuf, the geometry blobs are decoded straight into the geometry
 * classes, so the file's coordinate reference system is preserved.
 */
const parseGeoPackage = async (
  name: string,
  bytes: Uint8Array,
): Promise<ParseResult> => {
  try {
    const { data, crs, skipped } = await geoPackageToGeometry(
      bytes,
      sqlJsConfig,
    );
    if (data.multiPolygons.length === 0)
      return {
        ok: false,
        error:
          "No polygonal features found. Schematization requires Polygon or MultiPolygon geometry.",
      };
    return {
      ok: true,
      input: new Input(name, data, "gpkg", crs),
      vertexCount: data.vertexCount,
      skipped,
    };
  } catch (error) {
    return {
      ok: false,
      error: `Could not read GeoPackage: ${error instanceof Error ? error.message : "unknown error"}`,
    };
  }
};

/**
 * Read a GeoJSON file.
 *
 * Unlike FlatGeobuf this has no CRS of its own — RFC 7946 defines GeoJSON
 * coordinates as WGS84, which {@link Input.fromGeoJSON} records.
 */
const parseGeoJSON = (name: string, text: string): ParseResult => {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: "Could not parse file as JSON." };
  }

  const { type, features } = (json ?? {}) as Partial<FeatureCollection>;
  if (type !== "FeatureCollection" || !Array.isArray(features))
    return { ok: false, error: "Expected a GeoJSON FeatureCollection." };

  // `validateGeoJSON` rejects a collection outright if any feature is not
  // areal, so this is a whole-file check rather than a per-feature one.
  if (!validateGeoJSON(json as FeatureCollection))
    return {
      ok: false,
      error:
        "Unsupported GeoJSON. Every feature must be a Polygon or MultiPolygon.",
    };

  const input = Input.fromGeoJSON(
    json as FeatureCollection<Polygon | MultiPolygon>,
    name,
  );
  return { ok: true, input, vertexCount: input.data.vertexCount, skipped: 0 };
};

/**
 * Read the `.subdivision.json` fixtures: bare nested coordinate arrays rather
 * than GeoJSON, and so without a CRS of their own.
 */
const parseSubdivision = (name: string, text: string): ParseResult => {
  try {
    const coordinates = JSON.parse(text) as [number, number][][][][];
    const input = Input.fromCoordinates(name, coordinates);
    return { ok: true, input, vertexCount: input.data.vertexCount, skipped: 0 };
  } catch (error) {
    return {
      ok: false,
      error: `Could not read subdivision: ${error instanceof Error ? error.message : "unknown error"}`,
    };
  }
};

/**
 * Parse geodata into an {@link Input}, dispatching on the name's extension.
 *
 * The single entry point for both uploaded files and bundled samples fetched
 * over the network.
 * @param name the file name, whose extension selects the reader
 * @param bytes the file's contents
 * @returns the parsed input, or a message describing why it was rejected
 */
export const parseGeoBytes = async (
  name: string,
  bytes: Uint8Array,
): Promise<ParseResult> => {
  const lower = name.toLowerCase();
  // Checked before the extension switch, since the extension is `.json`.
  if (lower.endsWith(".subdivision.json"))
    return parseSubdivision(name, new TextDecoder().decode(bytes));
  const extension = lower.split(".").pop();
  switch (extension) {
    case "fgb":
      return parseFlatGeobuf(name, bytes);
    case "gpkg":
      return parseGeoPackage(name, bytes);
    case "geojson":
    case "json":
      return parseGeoJSON(name, new TextDecoder().decode(bytes));
    default:
      return {
        ok: false,
        error: `Unsupported file type "${extension ?? name}". Use .fgb, .gpkg or .geojson.`,
      };
  }
};

/**
 * Parse an uploaded geodata file into an {@link Input}.
 *
 * Supported: FlatGeobuf (`.fgb`), GeoPackage (`.gpkg`) and GeoJSON.
 * @param file the uploaded file
 * @returns the parsed input, or a message describing why it was rejected
 */
export const parseGeoFile = async (file: File): Promise<ParseResult> =>
  parseGeoBytes(file.name, new Uint8Array(await file.arrayBuffer()));

/**
 * Fetch and parse a bundled sample.
 * @param name the sample's file name, whose extension selects the reader
 * @param url the URL to fetch it from, base path already applied
 * @returns the parsed input, or a message describing why it was rejected
 */
export const parseGeoUrl = async (
  name: string,
  url: string,
): Promise<ParseResult> => {
  try {
    const response = await fetch(url);
    if (!response.ok)
      return {
        ok: false,
        error: `Could not load "${name}" (${response.status}).`,
      };
    return parseGeoBytes(name, new Uint8Array(await response.arrayBuffer()));
  } catch (error) {
    return {
      ok: false,
      error: `Could not load "${name}": ${error instanceof Error ? error.message : "unknown error"}`,
    };
  }
};
