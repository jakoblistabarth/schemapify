import * as geojson from "geojson";
import MultiPolygon from "./geometry/MultiPolygon";
import Polygon from "./geometry/Polygon";
import Ring from "./geometry/Ring";
import Subdivision from "./geometry/Subdivision";
import Vector2D from "./geometry/Vector2D";

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

function isTooDetailed(geoJSON: geojson.FeatureCollection) {
  const totalVertexCount = geoJSON.features.reduce((regionSum, feature) => {
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
  return totalVertexCount > 5000 ? true : false;
}

export function validateGeoJSON(geoJSON: geojson.FeatureCollection): boolean {
  if (!isRegion(geoJSON)) return false;
  if (isTooDetailed(geoJSON)) return false;
  return true;
}

export function crawlArray<T>(array: T[], index: number, n: number) {
  return array[(((index + n) % array.length) + array.length) % array.length];
}

export function getOccurrence<T>(array: T[], value: string | number) {
  return array.filter((v) => v === value).length;
}

export function createGeoJSON<
  G extends
    | geojson.Point
    | geojson.LineString
    | geojson.Polygon
    | geojson.MultiPolygon,
>(features: geojson.Feature<G>[]): geojson.FeatureCollection<G> {
  return {
    type: "FeatureCollection",
    features: features,
  };
}

/**
 * Turns an angle into a unit vector? // TODO: check if that's correct.
 * @param angle in radians
 * @returns a unit vector
 */
export function getUnitVector(angle: number): Vector2D {
  angle = angle > Math.PI ? angle - Math.PI * 2 : angle;
  return new Vector2D(Math.cos(angle), Math.sin(angle));
}

export function copyInstance<T>(original: T): T {
  return Object.assign(
    Object.create(Object.getPrototypeOf(original)),
    original,
  );
}

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
        // the rings points are already by definition sorted counterclockwise
        // remove redundant last point from geojson rings
        return new Ring(ring.points.slice(0, -1));
      });
      return new Polygon(rings);
    });

    return new MultiPolygon(polygons, idx.toString(), feature.properties);
  });

  return new Subdivision(multiPolygons);
};

// TODO: implement geometryToGeoJSON
