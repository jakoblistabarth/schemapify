import leaflet from "leaflet"; // TODO: load leaflet as module

export function logDCEL(dcel, verbose = false) {
  if (!verbose) console.log("DCEL", dcel);
  else {
    console.log("🡒 START DCEL:", dcel);

    dcel.getFaces().forEach((f) => {
      console.log("→ new face", f.uuid);
      f.getEdges().forEach((e) => {
        console.log(e, `(${e.tail.lng},${e.tail.lat})`);
      });
    });
    console.log("🡐 DCEL END");
  }
}

function createGeoJSON(features) {
  return {
    type: "FeatureCollection",
    features: features,
  };
}

export function mapFromDCEL(dcel, name) {
  const grid = document.getElementById("map-grid");
  let map = document.createElement("div");
  map.id = name;
  map.className = "map";
  grid.appendChild(map);

  const DCELMap = L.map(name);
  DCELMap.attributionControl.addAttribution(name);

  const vertexFeatures = Object.values(dcel.vertices).map((v) => {
    return {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [v.lng, v.lat],
      },
      properties: {
        uuid: v.uuid,
      },
    };
  });

  const verticesJSON = createGeoJSON(vertexFeatures);

  const geojsonMarkerOptions = {
    radius: 2,
    fillColor: "white",
    color: "black",
    weight: 1.5,
    opacity: 1,
    fillOpacity: 1,
  };

  const vertices = L.geoJson(verticesJSON, {
    pointToLayer: function (feature, latlng) {
      const uuid = feature.properties.uuid;
      const v = feature.geometry.coordinates;
      return L.circleMarker(latlng, geojsonMarkerOptions).bindTooltip(`
        <span class="material-icons">radio_button_checked</span> ${uuid.substring(0, 5)}
        (${v[0]}/${v[1]})
    `);
    },
    onEachFeature: onEachFeature,
  });

  const polygonFeatures = dcel.getInnerFaces().map((f) => {
    const halfEdges = f.getEdges();
    const featureProperties = f.properties;
    const coordinates = halfEdges.map((e) => [e.tail.lng, e.tail.lat]);
    coordinates.push([halfEdges[0].tail.lng, halfEdges[0].tail.lat]);
    return {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [coordinates], // TODO: implement holes
      },
      properties: { ...featureProperties, uuid: f.uuid },
    };
  });

  const polygonsJSON = createGeoJSON(polygonFeatures);

  const polygons = L.geoJSON(polygonsJSON, {
    style: function (feature) {
      return {
        color: "black",
        weight: 1,
      };
    },
    onEachFeature: onEachFeature,
  }).bindTooltip(function (layer) {
    const properties = Object.entries(layer.feature.properties)
      .map((elem) => {
        if (elem[0] !== "uuid")
          return `<tr><td>${elem[0]}</td> <td><strong>${elem[1]}</strong></td></tr>`;
      })
      .join("");
    return `
            <table>
            <tr>
                <td><span class="material-icons">highlight_alt</span> </td>
                <td><strong>${layer.feature.properties.uuid.substring(0, 5)}</strong></td>
            </tr>
            ${properties}
            </table>
            `;
  });

  function edgeStyle(feature) {
    return {
      color: "black",
      weight: 1,
    };
  }

  function onEachFeature(feature, layer) {
    layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlight,
    });
  }

  function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
      weight: 3,
      fillOpacity: 0.3,
    });
  }

  function resetHighlight(e) {
    halfEdges.resetStyle(e.target);
  }

  const halfEdgeFeatures = Object.values(dcel.halfEdges).map((e) => {
    const a = e.tail;
    const b = e.twin.tail;

    return {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [a.lng, a.lat],
          [b.lng, b.lat],
        ],
      },
      properties: {
        edge: `
                    <span class="material-icons">rotate_right</span>
                    ${e.uuid.substring(0, 5)} (${e.tail.lng}/${e.tail.lat})
                    <span class="material-icons">arrow_forward</span>
                    (${e.twin.tail.lng}/${e.twin.tail.lat})
                    <span class="material-icons">highlight_alt</span> ${e.face?.uuid.substring(
                      0,
                      5
                    )}`,
        twin: `
                    <span class="material-icons">rotate_left</span>
                    ${e.twin.uuid.substring(0, 5)} (${e.twin.tail.lng}/${e.twin.tail.lat})
                    <span class="material-icons">arrow_forward</span>
                    (${e.tail.lng}/${e.tail.lat})
                    <span class="material-icons">highlight_alt</span> ${e.twin.face?.uuid.substring(
                      0,
                      5
                    )}`,
      },
    };
  });

  const halfEdgesJSON = createGeoJSON(halfEdgeFeatures);
  const halfEdges = L.geoJSON(halfEdgesJSON, {
    style: edgeStyle,
    onEachFeature: onEachFeature,
  }).bindTooltip(function (layer) {
    return `
            ${layer.feature.properties.twin}<br>
            ${layer.feature.properties.edge}
            `;
  });

  polygons.addTo(DCELMap);
  halfEdges.addTo(DCELMap);
  vertices.addTo(DCELMap);
  DCELMap.fitBounds(vertices.getBounds());

  return DCELMap;
}
