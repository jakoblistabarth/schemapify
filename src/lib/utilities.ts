import * as geojson from "geojson";
import Point from "./geometry/Point";
import Vector2D from "./geometry/Vector2D";

export async function getJSON(path: string) {
  const response = await fetch(path);
  return response.json();
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
