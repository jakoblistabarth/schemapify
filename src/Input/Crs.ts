/**
 * A coordinate reference system.
 *
 * GeoJSON has no way to express this — RFC 7946 mandates WGS84 — so it is
 * carried on the {@link Input} instead, allowing projected sources such as
 * FlatGeobuf to keep their CRS.
 */
export type Crs = {
  /** The authority that defines the CRS, e.g. `"EPSG"`. */
  org?: string;
  /** The code within the authority, e.g. `31287`. */
  code?: number;
  /** A human-readable name, e.g. `"MGI / Austria Lambert"`. */
  name?: string;
  /** The full WKT definition, if the source provides one. */
  wkt?: string;
};

/** The CRS that GeoJSON coordinates are defined in (RFC 7946). */
export const wgs84: Crs = {
  org: "EPSG",
  code: 4326,
  name: "WGS 84",
};

/**
 * Whether a {@link Crs} is WGS84, the only CRS GeoJSON can express.
 * An unknown CRS is not assumed to be WGS84: the coordinates could be anything.
 * @param crs the CRS to test
 * @returns whether the data is defined in WGS84
 */
export const isWgs84 = (crs?: Crs) =>
  crs?.code === wgs84.code && (crs?.org ?? wgs84.org) === wgs84.org;

/**
 * Format a {@link Crs} for display, e.g. `"EPSG:31287 (MGI / Austria Lambert)"`.
 */
export const formatCrs = (crs?: Crs) => {
  if (!crs) return "unknown";
  const identifier = crs.org && crs.code ? `${crs.org}:${crs.code}` : undefined;
  if (identifier && crs.name) return `${identifier} (${crs.name})`;
  return identifier ?? crs.name ?? "unknown";
};
