import Dcel, { STEP } from "../lib/DCEL/Dcel";
import L from "leaflet/";
import Sector from "../lib/c-oriented-schematization/Sector";
import HalfEdge from "../lib/DCEL/HalfEdge";
import { ContractionType } from "src/lib/c-oriented-schematization/Contraction";

let map: L.Map;

export function renderDcel(dcel: Dcel, step: STEP = STEP.LOAD): L.Map {
  if (!map)
    map = L.map("map", {
      zoomControl: false,
      crs: L.CRS.Simple,
    });

  map.attributionControl.remove();
  L.control
    .attribution({ position: "bottomright" })
    .addAttribution(`${dcel.name} (${dcel.halfEdges.size / 2} edges)`)
    .addTo(map);

  function highlightDCELFeature(e: L.LeafletMouseEvent) {
    const feature = e.target;
    feature.setStyle({
      weight: 3,
      fillColor: "black",
      fillOpacity: feature.feature.properties.ringType === "inner" ? 0.25 : 0.5,
    });
  }

  const vertexLayer = L.geoJSON(dcel.snapShots[step].layers.vertices, {
    pointToLayer: function (feature, latlng) {
      const props = feature.properties;
      const v = feature.geometry.coordinates;
      const edges = props.edges
        .map((edge: HalfEdge) => {
          const head = edge.getHead();
          if (!head) return;
          const tail = edge.tail;
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
            feature.properties.edges.map((e: HalfEdge) => {
              const angle = e.getAngle();
              return angle ? (angle * 180) / Math.PI : undefined;
            })
          );
        },
      });
    },
  });

  const faceLayer = L.geoJSON(dcel.snapShots[step].layers.faces, {
    style: function (feature) {
      return {
        color: "transparent",
        fillColor: feature?.properties.ringType === "inner" ? "transparent" : "black",
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

  const edgeLayer = L.geoJSON(dcel.snapShots[step].layers.edges, {
    style: function (feature) {
      return {
        color: !feature?.properties.class && step === STEP.CLASSIFY ? "red" : "black",
        weight: !feature?.properties.class && step === STEP.CLASSIFY ? 4 : 1,
        dashArray: feature?.properties.incidentFaceType === "inner" ? "3,3" : "0",
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
          const length = edge.properties.length;
          const sectors = edge.properties.sector.map((sector: Sector) => sector.idx).join("+");
          const blockingNumberN = edge.properties.configuration[ContractionType.N]?.blockingNumber;
          const blockingNumberP = edge.properties.configuration[ContractionType.P]?.blockingNumber;
          const contractionAreaN = edge.properties.configuration[ContractionType.N]?.area;
          const contractionAreaP = edge.properties.configuration[ContractionType.P]?.area;
          console.log(
            `EDGE length: ${length}`,
            `sector: ${sectors}`,
            edge.properties.class,
            `contraction: (-)${blockingNumberN}:${contractionAreaN}, (+)${blockingNumberP}:${contractionAreaP}`
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

  const polygonLayer = L.geoJSON(dcel.snapShots[step].layers.features, {
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

  const staircaseRegionLayer = L.geoJSON(
    dcel.snapShots[STEP.STAIRCASEREGIONS].layers.staircaseRegions,
    {
      // TODO: implement better structure for snapshots
      style: function (feature) {
        return {
          color: feature?.properties.interferesWith.length > 0 ? "red" : "blue",
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
    }
  );

  map.fitBounds(vertexLayer.getBounds());

  function toggleLayer() {
    map.eachLayer((layer) => layer.remove());
    if (showPolygons) {
      polygonLayer.addTo(map);
      facesLabel.classList.remove("active");
      polygonsLabel.classList.add("active");
    } else {
      faceLayer.addTo(map);
      step === STEP.STAIRCASEREGIONS && staircaseRegionLayer.addTo(map);
      edgeLayer.addTo(map);
      vertexLayer.addTo(map);
      facesLabel.classList.add("active");
      polygonsLabel.classList.remove("active");
    }
  }
  const toggleBtn = <HTMLInputElement>document.querySelector("#layer-toggle");
  const polygonsLabel = <HTMLElement>document.querySelector("#polygons-label");
  const facesLabel = <HTMLElement>document.getElementById("faces-label");
  let showPolygons = toggleBtn.checked ? true : false;

  toggleLayer();
  toggleBtn.addEventListener("click", function () {
    showPolygons = !showPolygons;
    toggleLayer();
  });
  return map;
}
