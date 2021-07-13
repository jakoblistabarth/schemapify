import config, { Config } from "../../schematization.config";
import Vertex from "./Vertex";
import Point from "../geometry/Point";
import HalfEdge, { EdgeClasses } from "./HalfEdge";
import Face from "./Face";
import Staircase from "../orientation-restriction/Staircase";
import { copyInstance, createGeoJSON, groupBy } from "../utilities";
import * as geojson from "geojson";

export type Snapshot = {
  idx: number;
  name: string;
  layers: geojson.FeatureCollection[];
};

export type MapValueType<A> = A extends Map<any, infer V> ? V : never;

export interface DcelInterface {
  getVertexClass(): typeof Vertex;
  getHalfEdgeClass(): typeof HalfEdge;
  getVertices(): Vertex[];
}

class Dcel implements DcelInterface {
  vertices: Map<string, Vertex>;
  halfEdges: Map<string, HalfEdge>;
  faces: Face[];
  featureProperties: geojson.GeoJsonProperties;
  config: Config;
  snapShots: Snapshot[]; // Object to store geoJSON snapshots in

  constructor() {
    this.vertices = new Map();
    this.halfEdges = new Map();
    this.faces = [];
    this.featureProperties = {};
    this.config = undefined;
    this.snapShots = [];
  }

  getVertexClass(): typeof Vertex {
    return Vertex;
  }

  getHalfEdgeClass(): typeof HalfEdge {
    return HalfEdge;
  }

  /**
   * Creates a new Vertex and adds it to the DCEL.
   * @param x x coordinate of the new {@link Vertex}.
   * @param y y coordinate of the new {@link Vertex}.
   * @returns The created {@link Vertex}.
   */
  makeVertex(x: number, y: number): MapValueType<this["vertices"]> {
    const VertexClass = this.getVertexClass();
    const key = VertexClass.getKey(x, y);
    if (this.vertices.has(key)) return this.vertices.get(key);

    const vertex = new VertexClass(x, y, this);
    this.vertices.set(key, vertex);
    return vertex;
  }

  /**
   * Creates a new HalfEdge and adds it to the DCEL.
   * @param tail tail {@link Vertex} of the new {@link HalfEdge}.
   * @param head head {@link Vertex} of the new {@link HalfEdge}.
   * @returns The created HalfEdge.
   */
  makeHalfEdge(tail: Vertex, head: Vertex): MapValueType<this["halfEdges"]> {
    const key = HalfEdge.getKey(tail, head);
    if (this.halfEdges.has(key)) return this.halfEdges.get(key);

    const halfEdge = new HalfEdge(tail, this);
    this.halfEdges.set(key, halfEdge);
    tail.edges.push(halfEdge);
    tail.edges.sort();
    return halfEdge;
  }

  /**
   * Creates a new Face and adds it to the DCEL.
   * @returns The created {@link Face}.
   */
  makeFace(): Face {
    const face = new Face();
    this.faces.push(face);
    return face;
  }

  /**
   * Gets all Faces of the DCEL.
   * @returns An array of {@link Face}s.
   */
  getFaces(): Face[] {
    return this.faces;
  }

  /**
   * Returns only the bounded Faces of the DCEL (the unbounded outer Face is not returned).
   * @returns An array of {@link Face}s.
   */
  getBoundedFaces(): Face[] {
    return this.faces.filter((f) => f.edge !== null);
  }

  /**
   * Returns the unbounded Face of the DCEL.
   * @returns The unbounded {@link Face}.
   */
  getUnboundedFace(): Face {
    return this.faces.find((f) => f.edge === null);
  }

  /**
   * Returns Halfedges of the DCEL.
   * @param edgeClass If set, only the {@link HalfEdge}s of this class will be returned.
   * @param simple If true, for every pair of {@link HalfEdge}s only one will be returned. false by default.
   * @param significantTail If true, for a pair of {@link HalfEdge}s which do have a significant {@link Vertex}, the one where the significant {@link Vertex} is the tail will be returned, default = false
   * @returns A (sub)set of {@link HalfEdge}s.
   */
  getHalfEdges(edgeClass?: EdgeClasses, simple = false): MapValueType<this["halfEdges"]>[] {
    const halfEdges = [...this.halfEdges].map(([k, e]) => e);
    let edges = edgeClass ? halfEdges.filter((e) => e.class === edgeClass) : halfEdges;
    edges = simple ? this.getSimpleEdges(edges) : edges;
    return edges;
  }

  getSimpleEdges(edges: HalfEdge[]) {
    // FIXME: confusing for map output: sometimes clockwise/counterclockwise assignment in map output wrong
    let simpleEdges: Array<HalfEdge> = [];
    edges.forEach((halfEdge) => {
      const idx = simpleEdges.indexOf(halfEdge.twin);
      if (idx < 0) simpleEdges.push(halfEdge);
    });
    return simpleEdges;
  }

  getVertices() {
    return [...this.vertices].map(([k, v]) => v);
  }

  findVertex(x: number, y: number): Vertex {
    return this.vertices.get(Vertex.getKey(x, y));
  }

  removeHalfEdge(edge: HalfEdge): Map<string, HalfEdge> {
    const key = HalfEdge.getKey(edge.getTail(), edge.getHead());
    this.halfEdges.delete(key);
    return this.halfEdges;
  }

  /**
   * Creates a Doubly Connected Edge List (DCEL) data structure from a geoJSON.
   * @param geoJSON a valid geojson with features of type 'Polygon' or 'Multipolyon'
   * @returns
   */
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

          const edge = subdivision.getHalfEdges().find((e) => {
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
    while (subdivision.getHalfEdges().find((edge) => edge.face === null)) {
      const outerEdge = subdivision.getHalfEdges().find((edge) => edge.face === null);
      outerEdge.getCycle().forEach((edge) => {
        edge.face = unboundedFace;
      });
    }

    return subdivision;
  }

  /**
   * Gets an array of Points making up the bounding box of the DCEL.
   * As seen from [turf.js](https://github.com/Turfjs/turf/blob/master/packages/turf-bbox/index.ts).
   * @returns The bounding box of the {@link Dcel} as [minX, minY, maxX, maxY].
   */
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

  /**
   * Calculates the diameter of the DCEL (as the diameter of its bounding box).
   * @returns The diameter of the {@link Dcel}.
   */
  getDiameter(): number {
    const bbox = this.getBbox();
    const [a, c] = [new Point(bbox[0], bbox[1]), new Point(bbox[2], bbox[3])];
    return a.distanceToPoint(c);
  }

  /**
   * Sets ε, a constant threshold for the maximum edge length within a DCEL, in the DCEL's config object.
   * @param lambda A constant factor.
   * @returns Epsilon. The maximum length of a {@link HalfEdge}.
   */
  setEpsilon(lambda: number): number {
    return (this.config.epsilon = this.getDiameter() * lambda);
  }

  /**
   * Subdivide all edges of an DCEL so that no edges are longer than the defined threshold.
   * @param threshold
   * @returns A subdivided {@link Dcel}.
   */
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

  /**
   * Classifies all Vertices in the DCEL, adds new Vertices on an HalfEdge which has two significant Vertices.
   * By doing so it is guaranteed that every HalfEdge has at most one significant Vertex.
   */
  classifyVertices(): void {
    this.getVertices().forEach((v) => {
      v.isSignificant();
    });

    this.getHalfEdges(undefined, true).forEach((edge) => {
      const [tail, head] = edge.getEndpoints();
      if (tail.significant && head.significant) {
        const newPoint = edge.subdivide().getHead();
        newPoint.significant = false;
      }
    });
  }

  classify(): void {
    this.classifyVertices();
    this.halfEdges.forEach((e) => e.classify());
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

  toConsole(name: string, verbose: boolean = false): void {
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
        let newFace = copyInstance(f); // clone the object
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

  verticesToGeoJSON(): geojson.FeatureCollection {
    const vertexFeatures = [...this.vertices].map(([k, v]): geojson.Feature => {
      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [v.x, v.y],
        },
        properties: {
          uuid: v.uuid,
          significant: v.significant,
          edges: v.edges,
        },
      };
    });

    return createGeoJSON(vertexFeatures);
  }

  facesToGeoJSON(): geojson.FeatureCollection {
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

  staircasesToGeoJSON(): geojson.FeatureCollection {
    const staircaseFeatures = this.getHalfEdges(undefined, true).map((edge): geojson.Feature => {
      const staircase: Staircase = new Staircase(edge);
      const coordinates: number[][] = staircase.region.map((p) => [p.x, p.y]);
      return {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [coordinates],
        },
        properties: {
          edge: edge.uuid,
          edgeClass: edge.class,
        },
      };
    });
    return createGeoJSON(staircaseFeatures);
  }

  edgesToGeoJSON(): geojson.FeatureCollection {
    const edgeFeatures = this.getHalfEdges(undefined, true).map((e): geojson.Feature => {
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
          assignedDirection: e.assignedDirection,
          twinClass: e.twin.class,
          edge: `
              <span class="material-icons">rotate_left</span>
              ${e.getUuid(5)} (${e.tail.x}/${e.tail.y})
              <span class="material-icons">arrow_forward</span>
              (${e.twin.tail.x}/${e.twin.tail.y})
              <span class="material-icons">highlight_alt</span> ${e.face?.getUuid(5)}
              ${e.class}
              ${e.assignedDirection}
              `,
          twin: `
              <span class="material-icons">rotate_right</span>
              ${e.twin.getUuid(5)} (${e.twin.tail.x}/${e.twin.tail.y})
              <span class="material-icons">arrow_back</span>
              (${e.tail.x}/${e.tail.y})
              <span class="material-icons">highlight_alt</span> ${e.twin.face?.getUuid(5)}
              ${e.twin.class}
              ${e.twin.assignedDirection}
              `,
        },
      };
    });

    return createGeoJSON(edgeFeatures);
  }

  staircaseRegionsToGeoJSON(): geojson.FeatureCollection {
    const regionFeatures = this.getStaircases().map((staircase): geojson.Feature => {
      const regionPoints = staircase.region;
      regionPoints.push(regionPoints[0]); // add first Point to close geoJSON polygon

      return {
        type: "Feature",
        properties: {
          uuid: staircase.edge.uuid,
          class: staircase.edge.class,
          interferesWith: staircase.interferesWith,
        },
        geometry: {
          type: "Polygon",
          coordinates: [regionPoints.map((p) => [p.x, p.y])],
        },
      };
    });
    return createGeoJSON(regionFeatures);
  }
}

export default Dcel;
