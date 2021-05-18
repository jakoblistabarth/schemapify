import leaflet from "leaflet"; // TODO: load leaflet as module
import { DCELtoGeoJSON } from "./DCELtoGeoJSON.mjs";

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

export function createGeoJSON(features, name) {
  return {
    type: "FeatureCollection",
    name: name,
    features: features,
  };
}

export function mapFromDCEL(dcel, name) {
  const grid = document.getElementById("map-grid");
  const map = document.createElement("div");
  map.id = name;
  map.className = "map";
  grid.appendChild(map);

  const DCELMap = L.map(name, {
    zoomControl: false,
  });
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

  const verticesJSON = createGeoJSON(vertexFeatures, name + "_vertices");

  const geojsonMarkerOptions = {
    radius: 2,
    fillColor: "white",
    color: "black",
    weight: 1.5,
    opacity: 1,
    fillOpacity: 1,
  };

  const vertexLayer = L.geoJson(verticesJSON, {
    pointToLayer: function (feature, latlng) {
      const uuid = feature.properties.uuid;
      const v = feature.geometry.coordinates;
      return L.circleMarker(latlng, geojsonMarkerOptions).bindTooltip(`
        <span class="material-icons">radio_button_checked</span> ${uuid.substring(0, 5)}
        (${v[0]}/${v[1]})
    `);
    },
    onEachFeature: onEachEdge,
  });

  const faceFeatures = dcel.getInnerFaces().map((f) => {
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
      properties: { ...featureProperties, uuid: f.uuid, ringType: f.ringType },
    };
  });

  const facesJSON = createGeoJSON(faceFeatures, name + "_polygons");

  const faceLayer = L.geoJSON(facesJSON, {
    style: function (feature) {
      return {
        color: "black",
        weight: 1,
      };
    },
    onEachFeature: onEachEdge,
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

  function onEachEdge(feature, layer) {
    layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlightEdge,
    });
  }

  function onEachPolygon(feature, layer) {
    layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlightPolygon,
    });
  }

  function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
      weight: 3,
      fillOpacity: 0.3,
    });
  }

  function resetHighlightEdge(e) {
    edgeLayer.resetStyle(e.target);
  }

  function resetHighlightPolygon(e) {
    polygonLayer.resetStyle(e.target);
  }

  const edges = [];
  dcel.halfEdges.forEach((halfEdge) => {
    const idx = edges.indexOf(halfEdge.twin);
    if (idx < 0) edges.push(halfEdge);
  });

  const edgeFeatures = edges.map((e) => {
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
          <span class="material-icons">highlight_alt</span> ${e.face?.uuid.substring(0, 5)}`,
        twin: `
          <span class="material-icons">rotate_left</span>
          ${e.twin.uuid.substring(0, 5)} (${e.twin.tail.lng}/${e.twin.tail.lat})
          <span class="material-icons">arrow_forward</span>
          (${e.tail.lng}/${e.tail.lat})
          <span class="material-icons">highlight_alt</span> ${e.twin.face?.uuid.substring(0, 5)}`,
      },
    };
  });

  const edgesJSON = createGeoJSON(edgeFeatures, name + "_edges");
  const edgeLayer = L.geoJSON(edgesJSON, {
    style: edgeStyle,
    onEachFeature: onEachEdge,
  }).bindTooltip(function (layer) {
    return `
            ${layer.feature.properties.twin}<br>
            ${layer.feature.properties.edge}
            `;
  });

  const polygonsJSON = DCELtoGeoJSON(dcel);
  const polygonLayer = L.geoJSON(polygonsJSON, {
    style: function (feature) {
      return {
        color: "red",
        weight: 1,
      };
    },
    onEachFeature: onEachPolygon,
  }).bindTooltip(function (layer) {
    const properties = Object.entries(layer.feature.properties)
      .map((elem) => {
        return `<tr><td>${elem[0]}</td> <td><strong>${elem[1]}</strong></td></tr>`;
      })
      .join("");

    return `
            <table>
            <tr>
                <td><span class="material-icons">highlight_alt</span> </td>
            </tr>
            ${properties}
            </table>
            `;
  });

  faceLayer.addTo(DCELMap);
  edgeLayer.addTo(DCELMap);
  vertexLayer.addTo(DCELMap);
  DCELMap.fitBounds(vertexLayer.getBounds());

  function toggleLayer() {
    if (showPolygons) {
      polygonLayer.addTo(DCELMap);
      polygonLayer.bringToBack();
      faceLayer.remove();
      facesLabel.classList.remove("active");
      polygonsLabel.classList.add("active");
    } else {
      faceLayer.addTo(DCELMap);
      faceLayer.bringToBack();
      polygonLayer.remove();
      facesLabel.classList.add("active");
      polygonsLabel.classList.remove("active");
    }
  }
  const toggleBtn = document.querySelector("#layer-toggle");
  const polygonsLabel = document.querySelector("#polygons-label");
  const facesLabel = document.querySelector("#faces-label");
  let showPolygons = toggleBtn.checked ? true : false;
  toggleLayer();
  toggleBtn.addEventListener("click", function () {
    showPolygons = !showPolygons;
    toggleLayer();
  });
  return DCELMap;
}
