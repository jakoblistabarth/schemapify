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
  const outerRings = dcel.getBoundedFaces().filter((f) => f.outerRing === null);
  const groupByFID = groupBy("FID");
  const facesGrouped = groupByFID(outerRings);

  const features = Object.entries(facesGrouped).map(([fid, feature]) => {
    const featureProperties = dcel.featureProperties[fid];
    let featureCoordinates = [];
    let idx = 0;
    feature.forEach((ring) => {
      const halfEdges = ring.getEdges();
      const coordinates = halfEdges.map((e) => [e.tail.x, e.tail.y]);
      coordinates.push([halfEdges[0].tail.x, halfEdges[0].tail.y]);
      featureCoordinates.push([coordinates]);
      if (ring.innerEdges) {
        const ringCoordinates = [];
        ring.innerEdges.forEach((innerEdge) => {
          const halfEdges = innerEdge.getCycle(false); // go backwards to go counterclockwise also for holes
          const coordinates = halfEdges.map((e) => [e.tail.x, e.tail.y]);
          coordinates.push([halfEdges[0].tail.x, halfEdges[0].tail.y]);
          ringCoordinates.push(coordinates);
        });
        featureCoordinates[idx].push(...ringCoordinates);
      }
      idx++;
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
