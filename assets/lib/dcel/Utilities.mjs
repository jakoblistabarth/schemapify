import leaflet from "leaflet"; // TODO: load leaflet as module
import { DCELtoGeoJSON } from "./DCELtoGeoJSON.mjs";

export function logDCEL(dcel, name, verbose = false) {
  if (!verbose) console.log("DCEL " + name, dcel);
  else {
    console.log("🡒 START DCEL:", dcel);

    dcel.getFaces().forEach((f) => {
      console.log("→ new face", f.uuid);
      f.getEdges().forEach((e) => {
        console.log(e, `(${e.tail.x},${e.tail.y})`);
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
        coordinates: [v.x, v.y],
      },
      properties: {
        uuid: v.uuid,
      },
    };
  });

  const verticesJSON = createGeoJSON(vertexFeatures, name + "_vertices");

  const vertexStyleOptions = {
    radius: 2,
    fillColor: "white",
    color: "black",
    weight: 2,
    opacity: 1,
    fillOpacity: 1,
  };

  const vertexLayer = L.geoJson(verticesJSON, {
    pointToLayer: function (feature, latlng) {
      const uuid = feature.properties.uuid;
      const v = feature.geometry.coordinates;
      return L.circleMarker(latlng, vertexStyleOptions).bindTooltip(`
        <span class="material-icons">radio_button_checked</span> ${uuid.substring(0, 5)}
        (${v[0]}/${v[1]})
    `);
    },
    onEachFeature: onEachVertex,
  });

  const faceFeatures = dcel.getBoundedFaces().map((f) => {
    const halfEdges = f.getEdges();
    const coordinates = halfEdges.map((e) => [e.tail.x, e.tail.y]);
    coordinates.push([halfEdges[0].tail.x, halfEdges[0].tail.y]);
    return {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [coordinates], // TODO: implement holes
      },
      properties: {
        uuid: f.uuid,
        FID: f.FID,
        ringType: f.outerRing != null ? "inner" : "outer",
      },
    };
  });

  const facesJSON = createGeoJSON(faceFeatures, name + "_polygons");

  const faceLayer = L.geoJSON(facesJSON, {
    style: faceStyle,
    onEachFeature: onEachFace,
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
            `;
  });

  function faceStyle(feature) {
    return {
      color: "black",
      fillColor: feature.properties.ringType === "inner" ? "transparent" : "black",
      weight: 1,
      dashArray: feature.properties.ringType === "inner" ? "3,3" : "0",
    };
  }

  function edgeStyle(feature) {
    return {
      color: "black",
      weight: 1,
    };
  }

  function onEachVertex(feature, layer) {
    layer.on({
      mouseover: highlightDCELFeature,
      mouseout: resetHighlightVertex,
    });
  }

  function onEachEdge(feature, layer) {
    layer.on({
      mouseover: highlightDCELFeature,
      mouseout: resetHighlightEdge,
      click: clickEdge,
    });
  }

  function onEachFace(feature, layer) {
    layer.on({
      mouseover: highlightDCELFeature,
      mouseout: resetHighlightFace,
    });
  }

  function onEachPolygon(feature, layer) {
    layer.on({
      mouseover: highlightPolygonFeature,
      mouseout: resetHighlightPolygon,
    });
  }

  function highlightDCELFeature(e) {
    var feature = e.target;
    feature.setStyle({
      weight: 3,
      fillColor: "black",
      fillOpacity: feature.feature.properties.ringType === "inner" ? 0.25 : 0.5,
    });
  }

  function highlightPolygonFeature(e) {
    var feature = e.target;
    feature.setStyle({
      weight: 5,
      fillOpacity: 0.5,
    });
  }

  function resetHighlightVertex(e) {
    vertexLayer.resetStyle(e.target);
  }

  function resetHighlightEdge(e) {
    edgeLayer.resetStyle(e.target);
  }

  function resetHighlightPolygon(e) {
    e.target.bringToBack();
    polygonLayer.resetStyle(e.target);
  }

  function resetHighlightFace(e) {
    e.target.bringToBack();
    faceLayer.resetStyle(e.target);
  }

  function clickEdge(e) {
    console.log("length", e.target.feature.properties.length);
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
          [a.x, a.y],
          [b.x, b.y],
        ],
      },
      properties: {
        length: e.getLength(),
        edge: `
          <span class="material-icons">rotate_left</span>
          ${e.uuid.substring(0, 5)} (${e.tail.x}/${e.tail.y})
          <span class="material-icons">arrow_forward</span>
          (${e.twin.tail.x}/${e.twin.tail.y})
          <span class="material-icons">highlight_alt</span> ${e.face?.uuid.substring(0, 5)}`,
        twin: `
          <span class="material-icons">rotate_right</span>
          ${e.twin.uuid.substring(0, 5)} (${e.twin.tail.x}/${e.twin.tail.y})
          <span class="material-icons">arrow_back</span>
          (${e.tail.x}/${e.tail.y})
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
            ${layer.feature.properties.edge}<br>
            ${layer.feature.properties.twin}
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
      .slice(0, 5)
      .map((elem) => {
        return `<tr><td>${elem[0]}</td> <td><strong>${elem[1]}</strong></td></tr>`;
      })
      .join("");

    return `
            <table>
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
