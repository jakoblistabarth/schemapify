import type { SqlJsConfig } from "sql.js";
import type { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import Input from "./Input";
import { flatGeobufToGeometry } from "./flatGeobuf";
import { geoPackageToGeometry } from "./geoPackage";

/** An areal feature, the only kind a subdivision can be built from. */
type ArealFeature = FeatureCollection<
  Polygon | MultiPolygon
>["features"][number];

export type ReadResult =
  | {
      ok: true;
      input: Input;
      /** Vertex count, excluding the repeated closing point of each ring. */
      vertexCount: number;
      /** Number of features dropped because they are not areal. */
      skipped: number;
    }
  | { ok: false; error: string };

export type ReadOptions = {
  /** Passed to sql.js, notably `locateFile` for its wasm. */
  config?: SqlJsConfig;
  /**
   * Reject data with more vertices than this. The limit is a property of the
   * consumer rather than of the data, so it is left to the caller: the browser
   * needs one to stay responsive, a batch run does not.
   */
  maxVertexCount?: number;
};

/**
 * Read a GeoJSON FeatureCollection, keeping only its areal features.
 *
 * GeoJSON has no CRS of its own — RFC 7946 defines its coordinates as WGS84,
 * which {@link Input.fromGeoJSON} records.
 * @param name the file's name
 * @param text the file's contents
 * @returns the parsed input, or a message describing why it was rejected
 */
const readGeoJson = (name: string, text: string): ReadResult => {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: "Could not parse the file as JSON." };
  }

  const { type, features } = (json ?? {}) as Partial<FeatureCollection>;
  if (type !== "FeatureCollection" || !Array.isArray(features))
    return { ok: false, error: "Expected a GeoJSON FeatureCollection." };

  const areal = features.filter(
    (feature): feature is ArealFeature =>
      feature.geometry?.type === "Polygon" ||
      feature.geometry?.type === "MultiPolygon",
  );
  const input = Input.fromGeoJSON({ type, features: areal }, name);

  return {
    ok: true,
    input,
    vertexCount: input.data.vertexCount,
    skipped: features.length - areal.length,
  };
};

/**
 * Read the `.subdivision.json` fixtures: bare nested coordinate arrays rather
 * than GeoJSON, and so without a CRS of their own.
 * @param name the file's name
 * @param text the file's contents
 * @returns the parsed input, or a message describing why it was rejected
 */
const readSubdivision = (name: string, text: string): ReadResult => {
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
 * Read a binary geodata file.
 *
 * The bytes are decoded straight into the geometry classes, so the file's
 * coordinate reference system is preserved on the {@link Input} rather than
 * being lost to GeoJSON's WGS84-only coordinates.
 * @param name the file's name
 * @param bytes the file's contents
 * @param format which of the two binary formats to read
 * @param config passed to sql.js, for the GeoPackage reader's wasm
 * @returns the parsed input, or a message describing why it was rejected
 */
const readBinary = async (
  name: string,
  bytes: Uint8Array,
  format: "fgb" | "gpkg",
  config?: SqlJsConfig,
): Promise<ReadResult> => {
  const label = format === "fgb" ? "FlatGeobuf" : "GeoPackage";
  try {
    const { data, crs, skipped } =
      format === "fgb"
        ? await flatGeobufToGeometry(bytes)
        : await geoPackageToGeometry(bytes, config);
    return {
      ok: true,
      input: new Input(name, data, format, crs),
      vertexCount: data.vertexCount,
      skipped,
    };
  } catch (error) {
    return {
      ok: false,
      error: `Could not read ${label}: ${error instanceof Error ? error.message : "unknown error"}`,
    };
  }
};

/**
 * Read geodata into an {@link Input}, dispatching on the name's extension.
 *
 * The single entry point for every reader, whatever the caller: an uploaded
 * file, a bundled sample fetched over the network, or a path on disk. Features
 * which are not areal are dropped and counted rather than rejecting the file,
 * since a source may carry points or lines alongside its regions.
 * @param name the file name, whose extension selects the reader
 * @param bytes the file's contents
 * @param options the sql.js config and an optional vertex limit
 * @returns the parsed input, or a message describing why it was rejected
 */
export const readGeoData = async (
  name: string,
  bytes: Uint8Array,
  { config, maxVertexCount }: ReadOptions = {},
): Promise<ReadResult> => {
  const lower = name.toLowerCase();
  const result = await (async (): Promise<ReadResult> => {
    // Checked before the extension switch, since the extension is `.json`.
    if (lower.endsWith(".subdivision.json"))
      return readSubdivision(name, new TextDecoder().decode(bytes));
    switch (lower.split(".").pop()) {
      case "fgb":
        return readBinary(name, bytes, "fgb", config);
      case "gpkg":
        return readBinary(name, bytes, "gpkg", config);
      case "geojson":
      case "json":
        return readGeoJson(name, new TextDecoder().decode(bytes));
      default:
        return {
          ok: false,
          error: `Unsupported file type "${lower.split(".").pop() ?? name}". Use .fgb, .gpkg or .geojson.`,
        };
    }
  })();

  if (!result.ok) return result;

  if (result.input.data.multiPolygons.length === 0)
    return {
      ok: false,
      error:
        "No polygonal features found. Schematization requires Polygon or MultiPolygon geometry.",
    };

  // Applied to every format, not just GeoJSON: the limit is about how much
  // geometry the consumer can take, which the file's encoding says nothing about.
  if (maxVertexCount !== undefined && result.vertexCount > maxVertexCount)
    return {
      ok: false,
      error: `Too detailed: ${result.vertexCount} vertices, at most ${maxVertexCount} are supported.`,
    };

  return result;
};
