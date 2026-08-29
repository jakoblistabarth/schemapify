import { flatGeobufToGeometry } from "@/src/Input/flatGeobuf";
import Input from "@/src/Input/Input";
import { validateGeoJSON } from "@/src/utilities";
import type { FeatureCollection, MultiPolygon, Polygon } from "geojson";

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
 * Parse an uploaded geodata file into an {@link Input}.
 *
 * Supported: FlatGeobuf (`.fgb`) and GeoJSON (`.geojson`, `.json`).
 * @param file the uploaded file
 * @returns the parsed input, or a message describing why it was rejected
 */
export const parseGeoFile = async (file: File): Promise<ParseResult> => {
  const extension = file.name.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "fgb":
      return parseFlatGeobuf(
        file.name,
        new Uint8Array(await file.arrayBuffer()),
      );
    case "geojson":
    case "json":
      return parseGeoJSON(file.name, await file.text());
    default:
      return {
        ok: false,
        error: `Unsupported file type "${extension ?? file.name}". Use .fgb or .geojson.`,
      };
  }
};
