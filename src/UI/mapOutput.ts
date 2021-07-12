import Dcel from "../lib/DCEL/Dcel";
import * as L from "leaflet/";
import Sector from "../lib/c-oriented-schematization/Sector";
import HalfEdge from "../lib/DCEL/HalfEdge";

export function getMapFrom(dcel: Dcel, name: string): L.Map {
  const DCELMap = L.map(name, {
    zoomControl: false,
  });
  DCELMap.attributionControl.addAttribution(`${name} (${dcel.halfEdges.size / 2} edges)`);

  function highlightDCELFeature(e: L.LeafletMouseEvent) {
    const feature = e.target;
    feature.setStyle({
      weight: 3,
      fillColor: "black",
      fillOpacity: feature.feature.properties.ringType === "inner" ? 0.25 : 0.5,
    });
  }

  const vertexLayer = L.geoJSON(dcel.verticesToGeoJSON(), {
    pointToLayer: function (feature, latlng) {
      const props = feature.properties;
      const v = feature.geometry.coordinates;
      const edges = props.edges
        .map((edge: HalfEdge) => {
          const head = edge.getHead();
          const tail = edge.getTail();
          return `
              <tr>
                <td>${edge.getUuid(5)}</td>
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
                <td>AssignedDirection: ${edge.assignedDirection}
              </tr>
            `;
        })
        .join("");
      return L.circleMarker(latlng, {
        radius: props.significant ? 4 : 2,
        fillColor: !props.significant ? "grey" : "white",
        color: "black",
        weight: 2,
        opacity: 1,
        fillOpacity: 1,
      }).bindTooltip(`
          <span class="material-icons">radio_button_checked</span>
          ${props.uuid.substring(0, 5)}
          (${v[0]}/${v[1]})<br>
          significant: ${props.significant}<br>
          <table>
            ${edges}
          </table>
        `); // TODO: use getUuid()
    },
    onEachFeature: function (feature, layer) {
      layer.on({
        mouseover: highlightDCELFeature,
        mouseout: function (e) {
          vertexLayer.resetStyle(e.target);
        },
        click: function () {
          console.log(
            feature.properties.edges.map((e: HalfEdge) => (e.getAngle() * 180) / Math.PI)
          );
        },
      });
    },
  });

  const faceLayer = L.geoJSON(dcel.facesToGeoJSON(), {
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
      const properties = Object.entries(feature.properties)
        .map((elem) => {
          if (elem[0] !== "uuid")
            return `<tr><td>${elem[0]}</td> <td><strong>${elem[1]}</strong></td></tr>`;
        })
        .join("");

      layer.bindTooltip(
        `
          <table>
            <tr>
                <td><span class="material-icons">highlight_alt</span> </td>
                <td>
                  <strong>${feature.properties.uuid.substring(0, 5)}</strong>
                </td>
            </tr>
            ${properties}
          </table>
        ` // TODO: use getUuid()
      );
    },
  });

  const edgeLayer = L.geoJSON(dcel.edgesToGeoJSON(), {
    style: function (feature) {
      return {
        color: feature.properties.class ? "black" : "red",
        weight: feature.properties.class ? 1 : 4,
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
      layer.bindTooltip(
        `
          ${feature.properties.edge}<br>
          ${feature.properties.twin}
        `
      );
    },
  });

  const polygonLayer = L.geoJSON(dcel.toGeoJSON(), {
    style: function (feature) {
      return {
        color: "grey",
        weight: 2,
      };
    },
    onEachFeature: function (feature, layer) {
      layer.on({
        mouseover: function (e) {
          const feature = e.target;
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

      const properties = Object.entries(feature.properties)
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

      layer.bindTooltip(
        `
          <table>
            ${properties}
          </table>
        `
      );
    },
  });

  const staircaseRegionLayer = L.geoJSON(dcel.snapShots[0].layers[0], {
    // TODO: implement better structure for snapshots
    style: function (feature) {
      return {
        color: feature.properties.interferesWith.length > 0 ? "red" : "blue",
        weight: 1,
        fillOpacity: 0.2,
      };
    },
    onEachFeature: function (feature, layer) {
      layer.on({
        mouseover: function (e) {
          const feature = e.target;
          feature.setStyle({
            weight: 2,
            fillOpacity: 0.5,
          });
        },
        mouseout: function (e) {
          staircaseRegionLayer.resetStyle(e.target);
        },
      });

      const properties = Object.entries(feature.properties)
        .map((elem) => {
          return `
            <tr>
              <td>${elem[0]}</td>
              <td><strong>${elem[1]}</strong></td>
            </tr>
          `;
        })
        .join("");

      layer.bindTooltip(
        `
          <table>
            ${properties}
          </table>
        `
      );
    },
  });

  DCELMap.fitBounds(vertexLayer.getBounds());

  function toggleLayer() {
    if (showPolygons) {
      polygonLayer.addTo(DCELMap);
      faceLayer.remove();
      vertexLayer.remove();
      edgeLayer.remove();
      staircaseRegionLayer.remove();
      facesLabel.classList.remove("active");
      polygonsLabel.classList.add("active");
    } else {
      polygonLayer.remove();
      faceLayer.addTo(DCELMap);
      staircaseRegionLayer.addTo(DCELMap);
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
