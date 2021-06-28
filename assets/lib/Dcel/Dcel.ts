import config, { Config } from "../../schematization.config";
import Vertex from "./Vertex";
import Point from "../Geometry/Point";
import HalfEdge, { EdgeClasses } from "./HalfEdge";
import Face from "./Face";
import Staircase from "../OrientationRestriction/Staircase";
import { copyInstance, createGeoJSON, groupBy } from "../utilities";
import * as geojson from "geojson";

class Dcel {
  vertices: Map<string, Vertex>;
  halfEdges: Map<string, HalfEdge>;
  faces: Array<Face>;
  featureProperties: geojson.GeoJsonProperties;
  config: Config;
  staircaseRegions: geojson.Feature[];

  constructor() {
    this.vertices = new Map();
    this.halfEdges = new Map();
    this.faces = [];
    this.featureProperties = {};
    this.config = undefined;
    this.staircaseRegions = [];
  }

  makeVertex(x: number, y: number): Vertex {
    const key = Vertex.getKey(x, y);
    if (this.vertices.has(key)) return this.vertices.get(key);

    const vertex = new Vertex(x, y, this);
    this.vertices.set(key, vertex);
    return vertex;
  }

  makeHalfEdge(tail: Vertex, head: Vertex): HalfEdge {
    const key = HalfEdge.getKey(tail, head);
    if (this.halfEdges.has(key)) return this.halfEdges.get(key);

    const halfEdge = new HalfEdge(tail, this);
    this.halfEdges.set(key, halfEdge);
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

  /**
   *
   * @param edgeClass if set, only the halfEdges of this class will be returned
   * @param simple if true, for every pair of halfEdges only one will be returned, default = false
   * @param significantTail if true, for a pair of halfEdges which do have a significant vertex, the one where the significant vertex is the tail will be returned, default = false
   * @returns a (sub)set of halfEdges
   */
  getHalfEdges(edgeClass?: EdgeClasses, simple = false, fromSignificant = false): HalfEdge[] {
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

  getVertices(significant?: boolean) {
    if (significant)
      return [...this.vertices]
        .filter(([k, v]) => v.significant === significant)
        .map(([k, v]) => v);
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

  // as seen @ https://github.com/Turfjs/turf/blob/master/packages/turf-bbox/index.ts
  /**
   *
   * @returns the Boundingbox of the dcel as [minX, minY, maxX, maxY]
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
   *
   * @returns the diameter of the dcel (the diameter of its bounding box)
   */
  getDiameter(): number {
    const bbox = this.getBbox();
    const [a, c] = [new Point(bbox[0], bbox[1]), new Point(bbox[2], bbox[3])];
    return a.distanceToPoint(c);
  }

  /**
   *
   * @param lambda
   * @returns epsilon, a threshold for the maximum edge length in a dcel
   */
  setEpsilon(lambda: number): number {
    return (this.config.epsilon = this.getDiameter() * lambda);
  }

  /**
   *
   * @param threshold
   * @returns a subdivided dcel, with edges smaller than the threshold
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

  classifyVertices(): void {
    this.getVertices().forEach((v) => {
      v.isSignificant();
    });

    this.getHalfEdges(undefined, true).forEach((edge) => {
      const [tail, head] = edge.getEndpoints();
      if (tail.significant && head.significant) {
        const newPoint = edge.bisect().getHead();
        newPoint.significant = false;
      }
    });
  }

  classify(): void {
    this.classifyVertices();
    this.halfEdges.forEach((e) => e.classify());
  }

  edgesToStaircases() {
    const edgesPerType = {
      UB: this.getHalfEdges(EdgeClasses.UB, true).map((edge) =>
        !edge.getSignificantVertex() || edge.getSignificantVertex() === edge.getTail()
          ? edge
          : edge.twin
      ),
      AD: this.getHalfEdges(EdgeClasses.AD).filter(
        (edge) => edge.getSignificantVertex() === edge.getTail()
      ),
      E: this.getHalfEdges(EdgeClasses.E, true).map((edge) =>
        !edge.getSignificantVertex() || edge.getSignificantVertex() === edge.getTail()
          ? edge
          : edge.twin
      ),
      UD: this.getHalfEdges(EdgeClasses.UD, true).map((edge) =>
        !edge.getSignificantVertex() || edge.getSignificantVertex() === edge.getTail()
          ? edge
          : edge.twin
      ),
    };

    Object.values(edgesPerType).forEach((edges) => this.replaceWithStaircases(edges));
    this.getHalfEdges().forEach((edge) => (edge.class = EdgeClasses.AB));
  }

  replaceWithStaircases(edges: HalfEdge[]) {
    edges.forEach((edge) => {
      const staircase = new Staircase(edge);
      const stepPoints = staircase.getStaircasePoints().slice(1, -1);
      const regionPoints = staircase.region;

      regionPoints.push(staircase.region[0]); // add first Point again as last Point of polygon coordinates for geoJSON feature
      const staircaseFeature: geojson.Feature = {
        type: "Feature",
        properties: {
          edgeclass: edge.class,
        },
        geometry: {
          type: "Polygon",
          coordinates: [regionPoints.map((p) => [p.x, p.y])],
        },
      };
      this.staircaseRegions.push(staircaseFeature);

      let edgeToSplit = edge;
      for (let p of stepPoints) edgeToSplit = edgeToSplit.bisect(new Point(p.x, p.y)).next;
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
          significant: v.significant,
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

  staircasesToGeoJSON(): geojson.GeoJSON {
    const staircaseFeatures = this.getHalfEdges(undefined, true).map((edge): geojson.Feature => {
      console.log(edge.class);
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

  edgesToGeoJSON(): geojson.GeoJSON {
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
}

export default Dcel;
