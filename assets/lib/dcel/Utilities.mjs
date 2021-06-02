// import leaflet from "leaflet"; // FIXME: load leaflet as module
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

export function mapFromDCEL(dcel, name) {
  const DCELMap = L.map(name, {
    zoomControl: false,
  });
  DCELMap.attributionControl.addAttribution(name);

  function highlightDCELFeature(e) {
    var feature = e.target;
    feature.setStyle({
      weight: 3,
      fillColor: "black",
      fillOpacity: feature.feature.properties.ringType === "inner" ? 0.25 : 0.5,
    });
  }

  const vertexFeatures = Object.values(dcel.vertices).map((v) => {
    return {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [v.x, v.y],
      },
      properties: {
        uuid: v.uuid,
        isSignificant: v.schematizationProperties.isSignificant,
        edges: v.edges,
      },
    };
  });

  const verticesJSON = createGeoJSON(vertexFeatures, name + "_vertices");
  const vertexLayer = L.geoJson(verticesJSON, {
    pointToLayer: function (feature, latlng) {
      const props = feature.properties;
      const v = feature.geometry.coordinates;
      const edges = props.edges
        .map((edge) => {
          const head = edge.getHead();
          const tail = edge.getTail();
          return `
            <tr>
              <td>${edge.uuid.substring(0, 5)}</td>
              <td>
                (${tail.x}/${tail.y})
                <span class="material-icons">arrow_forward</span>
                (${head.x}/${head.y})
              </td>
              <td>Sectors: ${edge
                .getAssociatedSector()
                .map((s) => s.idx)
                .join(",")}</td>
              <td>${edge.schematizationProperties.classification}</td>
            </tr>
          `;
        })
        .join("");
      return L.circleMarker(latlng, {
        radius: feature.properties.isSignificant ? 4 : 2,
        fillColor: "white",
        color: "black",
        weight: 2,
        opacity: 1,
        fillOpacity: 1,
      }).bindTooltip(`
        <span class="material-icons">radio_button_checked</span> ${props.uuid.substring(0, 5)}
        (${v[0]}/${v[1]})<br>
        significant: ${props.isSignificant}<br>
        <table>
          ${edges}
        </table>
    `);
    },
    onEachFeature: onEachVertex,
  });

  function resetHighlightVertex(e) {
    vertexLayer.resetStyle(e.target);
  }

  function onEachVertex(feature, layer) {
    layer.on({
      mouseover: highlightDCELFeature,
      mouseout: resetHighlightVertex,
    });
  }

  const faceFeatures = dcel.getBoundedFaces().map((f) => {
    const halfEdges = f.getEdges();
    const coordinates = halfEdges.map((e) => [e.tail.x, e.tail.y]);
    coordinates.push([halfEdges[0].tail.x, halfEdges[0].tail.y]);
    return {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [coordinates],
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
      color: "transparent",
      fillColor: feature.properties.ringType === "inner" ? "transparent" : "black",
      weight: 1,
    };
  }

  function resetHighlightFace(e) {
    e.target.bringToBack();
    faceLayer.resetStyle(e.target);
  }

  function onEachFace(feature, layer) {
    layer.on({
      mouseover: highlightDCELFeature,
      mouseout: resetHighlightFace,
    });
  }

  const edgeFeatures = dcel.getSimpleEdges().map((e) => {
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
        incidentFaceType: e.face.outerRing ? "inner" : "outer",
        length: e.getLength(),
        sector: e.getAssociatedSector(),
        schematizationProperties: e.schematizationProperties,
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

  function edgeStyle(feature) {
    return {
      color: "black",
      weight: 1,
      dashArray: feature.properties.incidentFaceType === "inner" ? "3,3" : "0",
    };
  }

  function resetHighlightEdge(e) {
    edgeLayer.resetStyle(e.target);
  }

  function onEachEdge(feature, layer) {
    layer.on({
      mouseover: highlightDCELFeature,
      mouseout: resetHighlightEdge,
      click: clickEdge,
    });
  }

  function clickEdge(e) {
    const edge = e.target.feature;
    console.log(
      `edge => length: ${edge.properties.length} sector: ${edge.properties.sector}`,
      edge.properties.schematizationProperties
    );
  }

  const polygonsJSON = DCELtoGeoJSON(dcel);
  const polygonLayer = L.geoJSON(polygonsJSON, {
    style: function (feature) {
      return {
        color: "red",
        weight: 2,
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

  function highlightPolygonFeature(e) {
    var feature = e.target;
    feature.setStyle({
      weight: 4,
      fillOpacity: 0.5,
    });
  }

  function resetHighlightPolygon(e) {
    e.target.bringToBack();
    polygonLayer.resetStyle(e.target);
  }

  function onEachPolygon(feature, layer) {
    layer.on({
      mouseover: highlightPolygonFeature,
      mouseout: resetHighlightPolygon,
    });
  }

  faceLayer.addTo(DCELMap);
  edgeLayer.addTo(DCELMap);
  vertexLayer.addTo(DCELMap);
  DCELMap.fitBounds(vertexLayer.getBounds());

  function toggleLayer() {
    if (showPolygons) {
      polygonLayer.addTo(DCELMap);
      faceLayer.remove();
      vertexLayer.remove();
      edgeLayer.remove();
      facesLabel.classList.remove("active");
      polygonsLabel.classList.add("active");
    } else {
      polygonLayer.remove();
      faceLayer.addTo(DCELMap);
      edgeLayer.addTo(DCELMap);
      vertexLayer.addTo(DCELMap);
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
