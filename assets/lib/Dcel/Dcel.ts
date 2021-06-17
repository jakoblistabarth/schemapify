import config, { Config } from "../../schematization.config";
import Vertex, { Significance } from "./Vertex";
import Point from "../Geometry/Point";
import HalfEdge, { EdgeClasses } from "./HalfEdge";
import Face from "./Face";
import Staircase from "../OrientationRestriction/Staircase";
import { createGeoJSON, groupBy } from "../utilities";
import * as geojson from "geojson";

class Dcel {
  vertices: Map<string, Vertex>;
  halfEdges: Array<HalfEdge>;
  faces: Array<Face>;
  featureProperties: geojson.GeoJsonProperties;
  config: Config;

  constructor() {
    this.vertices = new Map();
    this.halfEdges = [];
    this.faces = [];
    this.featureProperties = {};
    this.config;
  }

  makeVertex(x: number, y: number): Vertex {
    const key = Vertex.getKey(x, y);
    if (this.vertices.has(key)) return this.vertices.get(key);

    const vertex = new Vertex(x, y, this);
    this.vertices.set(key, vertex);
    return vertex;
  }

  makeHalfEdge(tail: Vertex, head: Vertex): HalfEdge {
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

  makeFace(): Face {
    const face = new Face();
    this.faces.push(face);
    return face;
  }

  getFaces(): Array<Face> {
    return this.faces;
  }

  getBoundedFaces(): Array<Face> {
    return this.faces.filter((f) => f.edge !== null);
  }

  getUnboundedFace(): Face {
    return this.faces.find((f) => f.edge === null);
  }

  getSimpleEdges(): Array<HalfEdge> {
    // FIXME: confusing for map output: sometimes clockwise/counterclockwise assignment in map output wrong
    let simpleEdges: Array<HalfEdge> = [];
    this.getBoundedFaces().forEach((f) => {
      f.getEdges().forEach((halfEdge) => {
        const idx = simpleEdges.indexOf(halfEdge.twin);
        if (idx < 0) simpleEdges.push(halfEdge);
      });
    });
    return simpleEdges;
  }

  findVertex(x: number, y: number): Vertex {
    return this.vertices.get(Vertex.getKey(x, y));
  }

  removeHalfEdge(edge: HalfEdge): Array<HalfEdge> {
    const idx = this.halfEdges.indexOf(edge);
    if (idx > -1) {
      this.halfEdges.splice(idx, 1);
    }
    return this.halfEdges;
  }

  static fromGeoJSON(geoJSON: geojson.FeatureCollection): Dcel {
    const subdivision = new Dcel();

    subdivision.featureProperties = geoJSON.features.map(
      (feature: geojson.Feature) => feature.properties
    );

    const polygons = geoJSON.features.reduce((acc: Vertex[][][], feature: geojson.Feature) => {
      if (feature.geometry.type !== "Polygon" && feature.geometry.type !== "MultiPolygon") return;
      // TODO: check in e.g, parseGeoJSON()? if only polygons or multipolygons in geojson
      // TODO: add error-handling

      const multiPolygons =
        feature.geometry.type !== "MultiPolygon"
          ? [feature.geometry.coordinates]
          : feature.geometry.coordinates;

      acc.push(
        ...multiPolygons.map((polygon) =>
          polygon.map((ring: Array<number[]>) => {
            return ring.map((point: number[]) => {
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

    polygons.forEach((polygon: Vertex[][]) =>
      polygon.forEach((ring: Vertex[], idx: number) => {
        ring = idx > 0 ? ring.reverse() : ring; // sort clockwise ordered vertices of inner rings (geojson spec) counterclockwise
        const points = ring.slice(0, -1);

        points.forEach((tail: Vertex, idx: number) => {
          const head: Vertex = points[(idx + 1) % points.length]; // TODO: make this idx more elegant?
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
    geoJSON.features.forEach((feature: geojson.Feature, idx: number) => {
      if (feature.geometry.type !== "Polygon" && feature.geometry.type !== "MultiPolygon") return;
      // TODO: check in e.g, parseGeoJSON()? if only polygons or  multipolygons in geojson
      // TODO: add error handling

      const FID = idx;
      const multiPolygons =
        feature.geometry.type !== "MultiPolygon"
          ? [feature.geometry.coordinates]
          : feature.geometry.coordinates;

      let outerRingFace: Face;
      multiPolygons.forEach((polygon) =>
        polygon.forEach((ring: number[][], idx: number) => {
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
  getDiameter(): number {
    const bbox = this.getBbox();
    const [a, c] = [new Point(bbox[0], bbox[1]), new Point(bbox[2], bbox[3])];

    const diagonal = a.distanceToPoint(c);
    return diagonal;
  }

  // get epsilon
  // – the threshold for max edge length
  // takes the factor lambda
  // returns the treshold as float
  setEpsilon(lambda: number): number {
    return (this.config.epsilon = this.getDiameter() * lambda);
  }

  splitEdges(threshold = this.config.epsilon): Dcel {
    this.getBoundedFaces().forEach((f) => {
      f.getEdges().forEach((e) => {
        e.subdivideToThreshold(threshold);
      });
    });
    return this;
  }

  preProcess(): void {
    this.config = config;
    this.setEpsilon(this.config.lambda);
    this.splitEdges();
  }

  classifyVertices(): void {
    this.vertices.forEach((v) => {
      v.isSignificant();
    });
    this.getSimpleEdges().forEach((edge) => {
      const [head, tail] = edge.getEndpoints();
      if (head.isSignificant() === Significance.S && tail.isSignificant() === Significance.S) {
        const newPoint = edge.bisect().getHead();
        newPoint.significance = Significance.I;
      }
    });
  }

  classify(): void {
    this.classifyVertices();

    this.getSimpleEdges().forEach((edge) => {
      edge.getSignificantEndpoint().edges.forEach((edge) => {
        edge.classify();
      });
    });
  }

  edgesToStaircases(): void {
    this.getSimpleEdges()
      .filter((edge) => edge.class === EdgeClasses.AD) // TODO: remove when all staircases are implemented
      .forEach((edge) => {
        const stepPoints = new Staircase(edge).points.slice(1, -1);
        let edgeToSplit = edge;
        for (let p of stepPoints) {
          edgeToSplit = edgeToSplit.bisect(new Vertex(p.x, p.y, this)).next;
        }
      });
  }

  constrainAngles(): void {
    this.classify();
    this.edgesToStaircases();
  }

  simplify(): Dcel {
    // TODO: implement edge move
    return this;
  }

  schematize(): void {
    this.preProcess();
    this.constrainAngles();
    this.simplify();
  }

  log(name: string, verbose: boolean = false): void {
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

  toGeoJSON(): geojson.FeatureCollection {
    // copy faces, so that every face has only one FID
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

    const features = Object.values(outerRingsByFID).map(
      (feature: Face[], idx: number): geojson.Feature => {
        const featureProperties: geojson.GeoJsonProperties =
          this.featureProperties[Object.keys(outerRingsByFID)[idx]];
        let featureCoordinates: number[][][][] = [];
        let ringIdx = 0;
        feature.forEach((ring: Face) => {
          const halfEdges = ring.getEdges();
          const coordinates = halfEdges.map((e) => [e.tail.x, e.tail.y]);
          coordinates.push([halfEdges[0].tail.x, halfEdges[0].tail.y]);
          featureCoordinates.push([coordinates]);
          if (ring.innerEdges) {
            const ringCoordinates: number[][][] = [];
            ring.innerEdges.forEach((innerEdge: HalfEdge) => {
              const halfEdges: Array<HalfEdge> = innerEdge.getCycle(false); // go backwards to go counterclockwise also for holes
              const coordinates: number[][] = halfEdges.map((e) => [e.tail.x, e.tail.y]);
              coordinates.push([halfEdges[0].tail.x, halfEdges[0].tail.y]);
              ringCoordinates.push(coordinates);
            });
            featureCoordinates[ringIdx].push(...ringCoordinates);
          }
          ringIdx++;
        });
        return {
          type: "Feature",
          geometry: {
            type: "MultiPolygon",
            coordinates: featureCoordinates,
          },
          properties: featureProperties,
        };
      }
    );

    return createGeoJSON(features);
  }

  verticesToGeoJSON(): geojson.GeoJSON {
    const vertexFeatures = [...this.vertices].map(([k, v]): geojson.Feature => {
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

    return createGeoJSON(vertexFeatures);
  }

  facesToGeoJSON(): geojson.GeoJSON {
    const faceFeatures = this.getBoundedFaces().map((f): geojson.Feature => {
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

    return createGeoJSON(faceFeatures);
  }

  edgesToGeoJSON(): geojson.GeoJSON {
    const edgeFeatures = this.getSimpleEdges().map((e): geojson.Feature => {
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
          class: e.class,
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

    return createGeoJSON(edgeFeatures);
  }
}

export default Dcel;
