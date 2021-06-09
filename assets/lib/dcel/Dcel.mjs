import config from "../../schematization.config.mjs";
import Vertex from "./Vertex.mjs";
import { SIGNIFICANCE } from "./Vertex.mjs";
import HalfEdge from "./HalfEdge.mjs";
import Face from "./Face.mjs";
import { createGeoJSON, groupBy } from "../utilities.mjs";

class Dcel {
  constructor() {
    this.vertices = new Map();
    this.halfEdges = [];
    this.faces = [];
    this.featureProperties = null;
  }

  makeVertex(x, y) {
    const key = Vertex.getKey(x, y);
    if (this.vertices.has(key)) return this.vertices.get(key);

    const vertex = new Vertex(x, y, this);
    this.vertices.set(key, vertex);
    return vertex;
  }

  makeHalfEdge(tail, head) {
    const existingHalfEdge = this.halfEdges.find((edge) => {
      return tail == edge.tail && edge.twin?.tail == head; // TODO: check why .twin is only not defined in bisect()
    });
    if (existingHalfEdge) return existingHalfEdge;

    const halfEdge = new HalfEdge(tail, this);
    this.halfEdges.push(halfEdge);
    tail.edges.push(halfEdge);
    tail.edges.sort();
    return halfEdge;
  }

  makeFace() {
    const face = new Face();
    this.faces.push(face);
    return face;
  }

  getFaces() {
    return this.faces;
  }

  getBoundedFaces() {
    return this.faces.filter((f) => f.edge !== null);
  }

  getUnboundedFace() {
    return this.faces.find((f) => f.edge === null);
  }

  getSimpleEdges() {
    // FIXME: confusing for map output: sometimes clockwise/counterclockwise assignment in map output wrong
    let simpleEdges = [];
    this.getBoundedFaces().forEach((f) => {
      f.getEdges().forEach((halfEdge) => {
        const idx = simpleEdges.indexOf(halfEdge.twin);
        if (idx < 0) simpleEdges.push(halfEdge);
      });
    });
    return simpleEdges;
  }

  findVertex(x, y) {
    return this.vertices.get(Vertex.getKey(x, y));
  }

  removeHalfEdge(edge) {
    const idx = this.halfEdges.indexOf(edge);
    if (idx > -1) {
      this.halfEdges.splice(idx, 1);
    }
    return this.halfEdges;
  }

  static fromGeoJSON(geoJSON) {
    const subdivision = new Dcel();

    subdivision.featureProperties = geoJSON.features.map((feature) => feature.properties);

    const polygons = geoJSON.features.reduce((acc, feature) => {
      const multiPolygons =
        feature.geometry.type !== "MultiPolygon" // TODO: check in e.g, parseGeoJSON()? if only polygons in Multipolygons
          ? [feature.geometry.coordinates]
          : feature.geometry.coordinates;

      acc.push(
        ...multiPolygons.map((polygon) =>
          polygon.map((ring) => {
            return ring.map((point) => {
              return (
                subdivision.findVertex(point[0], point[1]) ||
                subdivision.makeVertex(point[0], point[1])
              );
            });
          })
        )
      );
      return acc;
    }, []);

    polygons.forEach((polygon) =>
      polygon.forEach((ring, idx) => {
        ring = idx > 0 ? ring.reverse() : ring; // sort clockwise ordered vertices of inner rings (geojson spec) counterclockwise
        const points = ring.slice(0, -1);

        points.forEach((tail, idx) => {
          const head = points[(idx + 1) % points.length]; // TODO: make this idx more elegant?
          const halfEdge = subdivision.makeHalfEdge(tail, head);
          const twinHalfEdge = subdivision.makeHalfEdge(head, tail);
          halfEdge.twin = twinHalfEdge;
          twinHalfEdge.twin = halfEdge;
        });
      })
    );

    // TODO: sort edges everytime a new edge is pushed to vertex.edges
    subdivision.vertices.forEach((vertex) => {
      // sort the half-edges whose tail vertex is that endpoint in clockwise order.
      // own words: sort all outgoing edges of current point in clockwise order
      vertex.sortEdges();

      // For every pair of half-edges e1, e2 in clockwise order, assign e1->twin->next = e2 and e2->prev = e1->twin.
      vertex.edges.forEach((e1, idx) => {
        const e2 = vertex.edges[(idx + 1) % vertex.edges.length];

        e1.twin.next = e2;
        e2.prev = e1.twin;
      });
    });

    // For every cycle, allocate and assign a face structure.
    geoJSON.features.forEach((feature, idx) => {
      const FID = idx;
      const multiPolygons =
        feature.geometry.type !== "MultiPolygon"
          ? [feature.geometry.coordinates]
          : feature.geometry.coordinates; // TODO: check in e.g, parseGeoJSON()? if only polygons in Multipolygons

      let outerRingFace;
      multiPolygons.forEach((polygon) =>
        polygon.forEach((ring, idx) => {
          ring = idx > 0 ? ring.reverse() : ring;
          const [firstPoint, secondPoint] = ring;
          const edge = subdivision.halfEdges.find((e) => {
            return (
              e.tail.x === firstPoint[0] &&
              e.tail.y === firstPoint[1] &&
              e.twin.tail.x === secondPoint[0] &&
              e.twin.tail.y === secondPoint[1]
            );
          });

          const existingFace = subdivision.faces.find((f) => f.edge === edge);
          if (existingFace) {
            existingFace.FID.push(FID);
          } else {
            if (idx === 0) {
              // only for outer ring
              outerRingFace = subdivision.makeFace();
              outerRingFace.FID = [FID];
              edge.getCycle().forEach((e) => (e.face = outerRingFace));
              outerRingFace.edge = edge;
            } else {
              const innerRingFace = subdivision.makeFace();
              innerRingFace.FID = [FID];
              innerRingFace.outerRing = outerRingFace;
              edge.getCycle().forEach((e) => (e.face = innerRingFace));
              innerRingFace.edge = edge;
              if (outerRingFace.innerEdges === null) outerRingFace.innerEdges = [];
              outerRingFace.innerEdges.push(edge);
              edge.twin.getCycle().forEach((e) => (e.face = outerRingFace));
            }
          }
        })
      );
    });

    // create unbounded Face (infinite outerFace) and assign it to edges which do not have a face yet
    const unboundedFace = subdivision.makeFace();
    while (subdivision.halfEdges.find((edge) => edge.face === null)) {
      const outerEdge = subdivision.halfEdges.find((edge) => edge.face === null);
      outerEdge.getCycle().forEach((edge) => {
        edge.face = unboundedFace;
      });
    }

    return subdivision;
  }

  // as seen @ https://github.com/Turfjs/turf/blob/master/packages/turf-bbox/index.ts
  // takes a dcel
  // returns its Boundingbox as [minX, minY, maxX, maxY]
  getBbox() {
    const points = [...this.vertices].map(([k, p]) => [p.x, p.y]);
    const bbox = [Infinity, Infinity, -Infinity, -Infinity];
    points.forEach((p) => {
      if (bbox[0] > p[0]) {
        bbox[0] = p[0];
      }
      if (bbox[1] > p[1]) {
        bbox[1] = p[1];
      }
      if (bbox[2] < p[0]) {
        bbox[2] = p[0];
      }
      if (bbox[3] < p[1]) {
        bbox[3] = p[1];
      }
    });
    return bbox;
  }

  // takes a dcel
  // returns its diameter
  getDiameter() {
    const bbox = this.getBbox();
    const [a, c] = [new Vertex(bbox[0], bbox[1]), new Vertex(bbox[2], bbox[3])];

    const diagonal = a.getDistance(c);
    return diagonal;
  }

  // get epsilon
  // – the threshold for max edge length
  // takes the factor lambda
  // returns the treshold as float
  setEpsilon(lambda) {
    this.epsilon = this.getDiameter() * lambda;
    return this.epsilon;
  }

  splitEdges(threshold = this.epsilon) {
    this.getBoundedFaces().forEach((f) => {
      f.getEdges().forEach((e) => {
        e.subdivideToThreshold(threshold);
      });
    });
    return this;
  }

  preProcess() {
    this.setEpsilon(config.lambda);
    this.splitEdges(this.epsilon);
  }

  classifyVertices() {
    this.vertices.forEach((v) => {
      v.isSignificant();
    });
    this.getSimpleEdges().forEach((edge) => {
      const [head, tail] = edge.getEndpoints();
      if (head.isSignificant() === SIGNIFICANCE.S && tail.isSignificant() === SIGNIFICANCE.S) {
        const newPoint = edge.bisect().getHead();
        newPoint.significance = SIGNIFICANCE.I;
      }
    });
  }

  classify() {
    this.classifyVertices();

    this.getSimpleEdges().forEach((edge) => {
      edge.getSignificantEndpoint().edges.forEach((edge) => {
        edge.classify();
      });
    });
  }

  edgesToStaircases() {
    // TODO: loop over all (simple?) edges replace them with staircase
    return this;
  }

  constrainAngles() {
    this.classify();
    this.edgesToStaircases();
  }

  simplify() {
    // TODO: implement edge move
    return this;
  }

  schematize() {
    this.preProcess();
    this.constrainAngles();
    this.simplify();
  }

  log(name, verbose = false) {
    if (!verbose) console.log("DCEL " + name, this);
    else {
      console.log("🡒 START DCEL:", this);

      this.getFaces().forEach((f) => {
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
    // console.log(this.getBoundedFaces());
    const flattenedFaces = this.getBoundedFaces().reduce((acc, f) => {
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
      const featureProperties = this.featureProperties[fid];
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

  verticesToGeoJSON(name) {
    const vertexFeatures = [...this.vertices].map(([k, v]) => {
      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [v.x, v.y],
        },
        properties: {
          uuid: v.uuid,
          significance: v.significance,
          edges: v.edges,
        },
      };
    });

    return createGeoJSON(vertexFeatures, name + "_vertices");
  }

  facesToGeoJSON(name) {
    const faceFeatures = this.getBoundedFaces().map((f) => {
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

    return createGeoJSON(faceFeatures, name + "_polygons");
  }

  EdgesToGeoJSON(name) {
    const edgeFeatures = this.getSimpleEdges().map((e) => {
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
              ${e.class}`,
          twin: `
              <span class="material-icons">rotate_right</span>
              ${e.twin.uuid.substring(0, 5)} (${e.twin.tail.x}/${e.twin.tail.y})
              <span class="material-icons">arrow_back</span>
              (${e.tail.x}/${e.tail.y})
              <span class="material-icons">highlight_alt</span> ${e.twin.face?.uuid.substring(0, 5)}
              ${e.twin.class}`,
        },
      };
    });

    return createGeoJSON(edgeFeatures, name + "_edges");
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

    const vertexLayer = L.geoJson(this.verticesToGeoJSON(name), {
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
                  <td>${edge.class}</td>
                </tr>
              `;
          })
          .join("");
        return L.circleMarker(latlng, {
          radius:
            props.significance === SIGNIFICANCE.S || props.significance === SIGNIFICANCE.T ? 4 : 2,
          fillColor: props.significance === SIGNIFICANCE.T ? "grey" : "white",
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

    const faceLayer = L.geoJSON(this.facesToGeoJSON(), {
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

    const edgeLayer = L.geoJSON(this.EdgesToGeoJSON(), {
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

    const polygonLayer = L.geoJSON(this.toGeoJSON(this.dcel), {
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

export default Dcel;
