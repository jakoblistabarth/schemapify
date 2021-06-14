import Dcel from "../Dcel/Dcel.js";
import * as L from "leaflet/";
import { Significance } from "../Dcel/Vertex.js";
import Sector from "../OrientationRestriction/Sector.js";
import HalfEdge from "../Dcel/HalfEdge.js";

export function getMapFrom(dcel: Dcel, name: string): L.Map {
  const DCELMap = L.map(name, {
    zoomControl: false,
  });
  DCELMap.attributionControl.addAttribution(name);

  function highlightDCELFeature(e: L.LeafletMouseEvent) {
    var feature = e.target;
    feature.setStyle({
      weight: 3,
      fillColor: "black",
      fillOpacity: feature.feature.properties.ringType === "inner" ? 0.25 : 0.5,
    });
  }

  const vertexLayer = L.geoJSON(dcel.verticesToGeoJSON(name), {
    pointToLayer: function (feature, latlng) {
      const props = feature.properties;
      const v = feature.geometry.coordinates;
      const edges = props.edges
        .map((edge: HalfEdge) => {
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
                  .map((s: Sector) => s.idx)
                  .join(",")}</td>
                <td>${edge.class}</td>
              </tr>
            `;
        })
        .join("");
      return L.circleMarker(latlng, {
        radius:
          props.significance === Significance.S || props.significance === Significance.T ? 4 : 2,
        fillColor: props.significance === Significance.T ? "grey" : "white",
        color: "black",
        weight: 2,
        opacity: 1,
        fillOpacity: 1,
      }).bindTooltip(`
          <span class="material-icons">radio_button_checked</span> ${props.uuid.substring(0, 5)}
          (${v[0]}/${v[1]})<br>
          significance: ${props.significance}<br>
          <table>
            ${edges}
          </table>
        `);
    },
    onEachFeature: function (feature, layer) {
      layer.on({
        mouseover: highlightDCELFeature,
        mouseout: function (e) {
          vertexLayer.resetStyle(e.target);
        },
      });
    },
  });

  const faceLayer = L.geoJSON(dcel.facesToGeoJSON(name), {
    style: function (feature) {
      return {
        color: "transparent",
        fillColor: feature.properties.ringType === "inner" ? "transparent" : "black",
        weight: 1,
      };
    },
    onEachFeature: function (feature, layer) {
      layer.on({
        mouseover: highlightDCELFeature,
        mouseout: function (e) {
          e.target.bringToBack();
          faceLayer.resetStyle(e.target);
        },
      });
    },
  }).bindTooltip(function (layer: L.Layer) {
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

  const edgeLayer = L.geoJSON(dcel.edgesToGeoJSON(name), {
    style: function (feature) {
      return {
        color: "black",
        weight: 1,
        dashArray: feature.properties.incidentFaceType === "inner" ? "3,3" : "0",
      };
    },
    onEachFeature: function (feature, layer) {
      layer.on({
        mouseover: highlightDCELFeature,
        mouseout: function (e) {
          edgeLayer.resetStyle(e.target);
        },
        click: function (e) {
          const edge = e.target.feature;
          console.log(
            `edge => length: ${edge.properties.length} sector: ${edge.properties.sector}`,
            edge.properties.class
          );
        },
      });
    },
  }).bindTooltip(function (layer) {
    return `
        ${layer.feature.properties.edge}<br>
        ${layer.feature.properties.twin}
      `;
  });

  const polygonLayer = L.geoJSON(dcel.toGeoJSON(name), {
    style: function (feature) {
      return {
        color: "grey",
        weight: 2,
      };
    },
    onEachFeature: function (feature, layer) {
      layer.on({
        mouseover: function (e) {
          var feature = e.target;
          feature.setStyle({
            weight: 4,
            fillOpacity: 0.5,
          });
        },
        mouseout: function (e) {
          e.target.bringToBack();
          polygonLayer.resetStyle(e.target);
        },
      });
    },
  }).bindTooltip(function (layer) {
    const properties = Object.entries(layer.feature.properties)
      .slice(0, 5)
      .map((elem) => {
        return `
            <tr>
              <td>${elem[0]}</td>
              <td><strong>${elem[1]}</strong></td>
            </tr>
          `;
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
  const toggleBtn: HTMLInputElement = document.querySelector("#layer-toggle");
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
