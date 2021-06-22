import * as geojson from "geojson";

export function crawlArray(array: any[], index: number, n: number) {
  return (((index + n) % array.length) + array.length) % array.length;
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
 *
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
