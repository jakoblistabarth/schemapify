import * as geojson from "geojson";
import Point from "./geometry/Point";

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

export const groupBy = (key: string) => (array: any[]) =>
  array.reduce((objectsByKeyValue, obj) => {
    const value = obj[key];
    objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj);
    return objectsByKeyValue;
  }, {});

/**
 * Turns an angle into a unit vector? // TODO: check if that's correct.
 * @param angle in radians
 * @returns a unit vector
 */
export function getUnitVector(angle: number): number[] {
  angle = angle > Math.PI ? angle - Math.PI * 2 : angle;
  return [Math.cos(angle), Math.sin(angle)];
}

export function copyInstance(original: object) {
  return Object.assign(Object.create(Object.getPrototypeOf(original)), original);
}

/**
 * Calculates the area of the irregular polyon defined by a set of points.
 * @param points an array of Points, which has to be sorted (either clockwise or counter-clockwise)
 * @returns the Area of the polygon
 */
export function getPolygonArea(points: Point[]): number {
  let total = 0;

  for (let i = 0; i < points.length; i++) {
    const addX = points[i].x;
    const addY = points[i == points.length - 1 ? 0 : i + 1].y;
    const subX = points[i == points.length - 1 ? 0 : i + 1].x;
    const subY = points[i].y;

    total += addX * addY * 0.5;
    total -= subX * subY * 0.5;
  }

  return Math.abs(total);
}
