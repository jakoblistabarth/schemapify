import {
  readGeoData,
  type ReadResult as ParseResult,
} from "@/src/Input/readGeoData";
import sqlJsConfig from "./sqlJsConfig";

export type { ParseResult };

const options = { config: sqlJsConfig };

/**
 * Parse an uploaded geodata file into an {@link Input}.
 *
 * Supported: FlatGeobuf (`.fgb`), GeoPackage (`.gpkg`) and GeoJSON.
 * @param file the uploaded file
 * @returns the parsed input, or a message describing why it was rejected
 */
export const parseGeoFile = async (file: File): Promise<ParseResult> =>
  readGeoData(file.name, new Uint8Array(await file.arrayBuffer()), options);

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
    return readGeoData(
      name,
      new Uint8Array(await response.arrayBuffer()),
      options,
    );
  } catch (error) {
    return {
      ok: false,
      error: `Could not load "${name}": ${error instanceof Error ? error.message : "unknown error"}`,
    };
  }
};
