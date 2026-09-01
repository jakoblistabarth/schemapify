import * as geojson from "geojson";
import MultiPolygon from "./geometry/MultiPolygon";
import Polygon from "./geometry/Polygon";
import Ring from "./geometry/Ring";
import Subdivision from "./geometry/Subdivision";
import Vector2D from "./geometry/Vector2D";
import { EPSILON, TWO_PI } from "./geometry/constants";

export async function getJSON(path: string) {
  const response = await fetch(path);
  return response.json();
}

function isRegion(geoJSON: geojson.FeatureCollection) {
  return geoJSON.features.every(
    (feature) =>
      feature.geometry.type === "Polygon" ||
      feature.geometry.type === "MultiPolygon",
  )
    ? true
    : false;
}

export const MAX_VERTEX_COUNT = 5000;

/**
 * Count the vertices of all areal features, ignoring the repeated closing
 * point of each ring. Non-areal features contribute nothing.
 * @param geoJSON the feature collection to measure
 * @returns the total vertex count
 */
const countVertices = (geoJSON: geojson.FeatureCollection): number => {
  return geoJSON.features.reduce((regionSum, feature) => {
    if (
      feature.geometry.type !== "Polygon" &&
      feature.geometry.type !== "MultiPolygon"
    )
      return regionSum;
    const multipolygon =
      feature.geometry.type === "Polygon"
        ? [feature.geometry.coordinates]
        : feature.geometry.coordinates;

    const featureVertexCount = multipolygon.reduce(
      (featureSum, externalRing) => {
        const ringCount = externalRing.reduce((ringSum, ring) => {
          return ringSum + ring.length - 1;
        }, 0);
        return featureSum + ringCount;
      },
      0,
    );

    return regionSum + featureVertexCount;
  }, 0);
};

const isTooDetailed = (geoJSON: geojson.FeatureCollection) => {
  return countVertices(geoJSON) > MAX_VERTEX_COUNT;
};

export const validateGeoJSON = (
  geoJSON: geojson.FeatureCollection,
): boolean => {
  if (!isRegion(geoJSON)) return false;
  if (isTooDetailed(geoJSON)) return false;
  return true;
};

export const crawlArray = <T>(array: T[], index: number, n: number) => {
  return array[(((index + n) % array.length) + array.length) % array.length];
};

export const getOccurrence = <T>(array: T[], value: string | number) => {
  return array.filter((v) => v === value).length;
};

export const createGeoJSON = <
  G extends
    | geojson.Point
    | geojson.LineString
    | geojson.Polygon
    | geojson.MultiPolygon,
>(
  features: geojson.Feature<G>[],
): geojson.FeatureCollection<G> => {
  return {
    type: "FeatureCollection",
    features: features,
  };
};

/**
 * Turns an angle into a unit vector? // TO-DO: check if that's correct.
 * @param angle in radians
 * @returns a unit vector
 */
export const getUnitVector = (angle: number): Vector2D => {
  angle = angle > Math.PI ? angle - TWO_PI : angle;
  return new Vector2D(Math.cos(angle), Math.sin(angle));
};

export const copyInstance = <T>(original: T): T => {
  return Object.assign(
    Object.create(Object.getPrototypeOf(original)),
    original,
  );
};

/**
 * Return all permutations of `arr`.
 *
 * Exponential O(n!) — intended for small arrays (n <= 8).
 * @param arr input values
 * @returns list of permutations
 */
export const permute = <T>(arr: T[]): T[][] => {
  if (arr.length === 0) return [[]];
  return arr.flatMap((v, i) =>
    permute([...arr.slice(0, i), ...arr.slice(i + 1)]).map((p) => [v, ...p]),
  );
};

export const geoJsonToGeometry = (
  geoJson: geojson.FeatureCollection<geojson.Polygon | geojson.MultiPolygon>,
) => {
  const multiPolygons = geoJson.features.map((feature, idx) => {
    const multipolygons =
      feature.geometry.type !== "MultiPolygon"
        ? [feature.geometry.coordinates]
        : feature.geometry.coordinates;

    const polygons = multipolygons.map((polygon) => {
      const rings = polygon.map((ringPositions) => {
        const ring = Ring.fromCoordinates(ringPositions as [number, number][]);
        // The rings points are already by definition sorted counterclockwise
        // remove redundant last point from GeoJSON rings
        return new Ring(ring.points.slice(0, -1));
      });
      return new Polygon(rings);
    });

    return new MultiPolygon(polygons, idx.toString(), feature.properties);
  });

  return new Subdivision(multiPolygons);
};

/**
 * Normalizes an angle to be between 0 and 2π.
 * @param a the angle in radians to normalize
 * @returns the normalized angle in radians
 */
export const normalizeAngle = (a: number) => {
  return ((a % TWO_PI) + TWO_PI) % TWO_PI;
};

/**
 * Determines whether two angles point in the same direction.
 *
 * Compared the short way around and with a tolerance: an angle derived from
 * coordinates lands a hair off the direction those coordinates were built from, and a
 * hair under a whole turn is a hair from zero rather than a whole turn away from it.
 * @param a the first angle in radians
 * @param b the second angle in radians
 * @returns whether the two point the same way
 */
export const isSameAngle = (a: number, b: number) => {
  const difference = Math.abs(normalizeAngle(a) - normalizeAngle(b));
  return Math.min(difference, TWO_PI - difference) < EPSILON;
};

/**
 * Converts an angle from radians to degrees.
 * @param radians the angle in radians
 * @returns the angle in degrees
 */
export const radiansToDegrees = (radians: number) => {
  return (radians * 180) / Math.PI;
};

/**
 * Converts an angle from degrees to radians.
 * @param degrees the angle in degrees
 * @returns the angle in radians
 */
export const degreesToRadians = (degrees: number) => {
  return (degrees * Math.PI) / 180;
};
