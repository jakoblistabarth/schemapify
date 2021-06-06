export function crawlArray(array, index, n) {
  return (((index + n) % array.length) + array.length) % array.length;
}

export function getOccurrence(array, value) {
  return array.filter((v) => v === value).length;
}

export function createGeoJSON(features, name) {
  return {
    type: "FeatureCollection",
    name: name,
    features: features,
  };
}

export const groupBy = (key) => (array) =>
  array.reduce((objectsByKeyValue, obj) => {
    const value = obj[key];
    objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj);
    return objectsByKeyValue;
  }, {});
