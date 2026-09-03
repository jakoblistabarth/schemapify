import type { Feature, HeaderMeta, IFeature } from "flatgeobuf";
import { generic, Geometry } from "flatgeobuf";
import MultiPolygon from "../geometry/MultiPolygon";
import Polygon from "../geometry/Polygon";
import Subdivision from "../geometry/Subdivision";
import type { Crs } from "./Crs";

const { GeometryType } = generic;

/**
 * The result of reading a FlatGeobuf file.
 */
export type FlatGeobufResult = {
  data: Subdivision;
  /** The coordinate reference system declared in the file's header, if any. */
  crs?: Crs;
  /** Number of features dropped because they are not Polygon or MultiPolygon. */
  skipped: number;
};

/**
 * A parsed feature, carried through the deserializer.
 * Extends {@link IFeature} (whose members are all optional) so it satisfies
 * the `FromFeatureFn` signature without a cast on the way in.
 */
type ParsedFeature = IFeature & {
  multiPolygon?: MultiPolygon;
};

/**
 * Split a geometry's flat, interleaved `xy` buffer into rings.
 *
 * Z and M ordinates live in separate buffers (`zArray`/`mArray`) which are
 * never read, so the result is two-dimensional by construction — no stripping
 * of a third ordinate is needed.
 * @param geometry a Polygon geometry
 * @returns one array of positions per ring, exterior ring first
 */
const toRings = (geometry: Geometry): [number, number][][] => {
  const xy = geometry.xyArray();
  if (!xy) return [];
  const ends = geometry.endsArray();
  // A polygon with a single ring carries no `ends`; the whole buffer is one
  // ring. Otherwise `ends` holds the cumulative *position* count per ring.
  const ringEnds = ends && ends.length > 0 ? Array.from(ends) : [xy.length / 2];

  const rings: [number, number][][] = [];
  let start = 0;
  for (const end of ringEnds) {
    const positions: [number, number][] = [];
    for (let i = start; i < end; i++)
      positions.push([xy[i * 2], xy[i * 2 + 1]]);
    if (positions.length > 0) rings.push(positions);
    start = end;
  }
  return rings;
};

/**
 * Read one feature's geometry as a {@link MultiPolygon}, or `undefined` if the
 * feature is not areal.
 */
const toMultiPolygon = (
  feature: Feature,
  header: HeaderMeta,
  id: number,
): MultiPolygon | undefined => {
  const geometry = feature.geometry();
  if (!geometry) return undefined;

  // When every feature shares one geometry type, FlatGeobuf stores it once in
  // the header and leaves the per-feature type `Unknown`. Mixed files do the
  // opposite. Both orderings occur, so fall back in either direction.
  const type =
    geometry.type() !== GeometryType.Unknown
      ? geometry.type()
      : header.geometryType;

  const polygons =
    type === GeometryType.MultiPolygon
      ? Array.from({ length: geometry.partsLength() }, (_, i) =>
          geometry.parts(i),
        )
          .filter((part) => part !== null)
          .map((part) => Polygon.fromUnorderedCoordinates(toRings(part)))
      : type === GeometryType.Polygon
        ? [Polygon.fromUnorderedCoordinates(toRings(geometry))]
        : [];

  if (polygons.length === 0) return undefined;

  return new MultiPolygon(
    polygons,
    id.toString(),
    generic.parseProperties(feature, header.columns),
  );
};

/**
 * Normalize the header's CRS, dropping the `null`s the format uses for absent
 * values.
 */
const toCrs = (crs: HeaderMeta["crs"]): Crs | undefined => {
  if (!crs) return undefined;
  return {
    org: crs.org ?? undefined,
    code: crs.code,
    name: crs.name ?? undefined,
    wkt: crs.wkt ?? undefined,
  };
};

/**
 * Read a FlatGeobuf file into a {@link Subdivision}.
 *
 * The binary is read straight into the geometry classes.
 * @param bytes the contents of a `.fgb` file
 * @returns the subdivision, its CRS, and the number of non-areal features dropped
 */
export const flatGeobufToGeometry = async (
  bytes: Uint8Array,
): Promise<FlatGeobufResult> => {
  let crs: Crs | undefined;
  let skipped = 0;

  // `deserialize` is declared as returning `IFeature[]` for a Uint8Array
  // input, but the implementation is an `async function*` for every input
  // type. The cast corrects that; iterating the declared type would silently
  // yield nothing.
  const features = generic.deserialize(
    bytes,
    (id, feature, header): ParsedFeature => {
      crs ??= toCrs(header.crs);
      return { multiPolygon: toMultiPolygon(feature, header, id) };
    },
  ) as unknown as AsyncGenerator<ParsedFeature>;

  const multiPolygons: MultiPolygon[] = [];
  for await (const { multiPolygon } of features) {
    if (multiPolygon) multiPolygons.push(multiPolygon);
    else skipped++;
  }

  return { data: new Subdivision(multiPolygons), crs, skipped };
};
