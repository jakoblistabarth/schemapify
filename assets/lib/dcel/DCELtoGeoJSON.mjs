function createGeoJSON(features, name) {
  //TODO: cannot import this from utilities.mjs because leaflet import in utilities.mjs throws error in jasmine
  return {
    type: "FeatureCollection",
    name: name,
    features: features,
  };
}

const groupBy = (key) => (array) =>
  array.reduce((objectsByKeyValue, obj) => {
    const value = obj[key];
    objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj);
    return objectsByKeyValue;
  }, {});

export function DCELtoGeoJSON(dcel, name) {
  const groupByFID = groupBy("FID");
  const facesGrouped = groupByFID(dcel.getInnerFaces());
  const features = Object.values(facesGrouped).map((feature) => {
    let featureCoordinates = [];
    let featureProperties;
    let idx = 0;
    feature.forEach((ring) => {
      featureProperties = ring.properties;
      const halfEdges = ring.ringType === "interior" ? ring.getEdges(false) : ring.getEdges();
      const coordinates = halfEdges.map((e) => [e.tail.lng, e.tail.lat]);
      coordinates.push([halfEdges[0].tail.lng, halfEdges[0].tail.lat]);
      if (ring.ringType === "interior") {
        featureCoordinates[idx - 1].push(coordinates);
      } else {
        featureCoordinates.push([coordinates]);
        idx++;
      }
    });
    return {
      type: "Feature",
      geometry: {
        type: "MultiPolygon",
        coordinates: featureCoordinates, // TODO: implement holes
      },
      properties: featureProperties,
    };
  });

  const json = createGeoJSON(features, name);
  return json;
}
