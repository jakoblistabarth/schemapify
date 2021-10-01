import * as geojson from "geojson";
import Vector2D from "./geometry/Vector2D";
// import { hint } from "@mapbox/geojsonhint";

export async function getJSON(path: string) {
  const response = await fetch(path);
  return response.json();
}

function isRegion(geoJSON: geojson.FeatureCollection) {
  return geoJSON.features.every(
    (feature) => feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon"
  )
    ? true
    : false;
}

function isTooDetailed(geoJSON: geojson.FeatureCollection) {
  const totalVertexCount = geoJSON.features.reduce((regionSum, feature) => {
    if (feature.geometry.type !== "Polygon" && feature.geometry.type !== "MultiPolygon")
      return regionSum;
    const multipolygon =
      feature.geometry.type === "Polygon"
        ? [feature.geometry.coordinates]
        : feature.geometry.coordinates;

    const featureVertexCount = multipolygon.reduce((featureSum, externalRing) => {
      const ringCount = externalRing.reduce((ringSum, ring) => {
        return ringSum + ring.length - 1;
      }, 0);
      return featureSum + ringCount;
    }, 0);

    return regionSum + featureVertexCount;
  }, 0);
  return totalVertexCount > 5000 ? true : false;
}

// function isValidGeoJSON(geoJSON: geojson.FeatureCollection) {
//   const errors = hint(JSON.stringify(geoJSON, null, 4));
//   return errors.length > 0 ? false : true;
// }

export function validateGeoJSON(geoJSON: geojson.FeatureCollection): boolean {
  // if (!isValidGeoJSON(geoJSON)) return false;
  if (!isRegion(geoJSON)) return false;
  if (isTooDetailed(geoJSON)) return false;
  return true;
}

export function crawlArray(array: any[], index: number, n: number) {
  return array[(((index + n) % array.length) + array.length) % array.length];
}

export function getOccurrence(array: any[], value: string | number) {
  return array.filter((v) => v === value).length;
}

export function createGeoJSON(features: geojson.Feature[]): geojson.FeatureCollection {
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
  return Object.assign(Object.create(Object.getPrototypeOf(original)), original);
}
