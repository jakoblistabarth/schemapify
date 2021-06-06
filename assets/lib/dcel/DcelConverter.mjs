import { groupBy, createGeoJSON } from "../utilities.mjs";

class DcelConverter {
  constructor(dcel) {
    this.dcel = dcel;
  }

  log(name, verbose = false) {
    if (!verbose) console.log("DCEL " + name, this.dcel);
    else {
      console.log("🡒 START DCEL:", this.dcel);

      this.dcel.getFaces().forEach((f) => {
        console.log("→ new face", f.uuid);
        f.getEdges().forEach((e) => {
          console.log(e, `(${e.tail.x},${e.tail.y})`);
        });
      });
      console.log("🡐 DCEL END");
    }
  }

  toGeoJSON(name) {
    // copy faces, so that every face has only one FID
    const flattenedFaces = this.dcel.getBoundedFaces().reduce((acc, f) => {
      f.FID.forEach((id, idx) => {
        let newFace = Object.assign(Object.create(Object.getPrototypeOf(f)), f); // clone the object
        newFace.FID = id;
        if (idx > 0) newFace.outerRing = null;
        acc.push(newFace);
      });
      return acc;
    }, []);

    const outerRings = flattenedFaces.filter((f) => f.outerRing === null);
    const groupByFID = groupBy("FID");
    const outerRingsByFID = groupByFID(outerRings);

    const features = Object.entries(outerRingsByFID).map(([fid, feature]) => {
      const featureProperties = this.dcel.featureProperties[fid];
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
          coordinates: featureCoordinates,
        },
        properties: featureProperties,
      };
    });

    return createGeoJSON(features, name);
  }

  toMap(name) {
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

    const vertexFeatures = [...this.dcel.vertices].map(([k, v]) => {
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
          fillColor: feature.properties.isSignificant === "treatedAsSignificant" ? "grey" : "white",
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
      onEachFeature: function (feature, layer) {
        layer.on({
          mouseover: highlightDCELFeature,
          mouseout: function (e) {
            vertexLayer.resetStyle(e.target);
          },
        });
      },
    });

    const faceFeatures = this.dcel.getBoundedFaces().map((f) => {
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

    const edgeFeatures = this.dcel.getSimpleEdges().map((e) => {
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
              <span class="material-icons">highlight_alt</span> ${e.face?.uuid.substring(0, 5)}
              ${e.schematizationProperties.classification}`,
          twin: `
              <span class="material-icons">rotate_right</span>
              ${e.twin.uuid.substring(0, 5)} (${e.twin.tail.x}/${e.twin.tail.y})
              <span class="material-icons">arrow_back</span>
              (${e.tail.x}/${e.tail.y})
              <span class="material-icons">highlight_alt</span> ${e.twin.face?.uuid.substring(0, 5)}
              ${e.twin.schematizationProperties.classification}`,
        },
      };
    });

    const edgesJSON = createGeoJSON(edgeFeatures, name + "_edges");
    const edgeLayer = L.geoJSON(edgesJSON, {
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
              edge.properties.schematizationProperties
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

    const polygonsJSON = this.toGeoJSON(this.dcel);
    const polygonLayer = L.geoJSON(polygonsJSON, {
      style: function (feature) {
        return {
          color: "red",
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
}

export default DcelConverter;
