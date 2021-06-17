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
