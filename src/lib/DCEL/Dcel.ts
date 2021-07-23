import * as geojson from "geojson";
import { STEP } from "../../../src/UI/algorithm-navigator";
import config, { Config } from "../../schematization.config";
import Configuration from "../c-oriented-schematization/Configuration";
import FaceFaceBoundaries from "../c-oriented-schematization/FaceFaceBoundaries";
import Staircase from "../c-oriented-schematization/Staircase";
import Point from "../geometry/Point";
import { copyInstance, createGeoJSON, groupBy } from "../utilities";
import Face from "./Face";
import HalfEdge, { OrientationClasses } from "./HalfEdge";
import Vertex from "./Vertex";

/**
 * Holds the current state of the schematized data as an array of GeoJSON Feature Collections.
 */
type Snapshot = {
  layers: SnapshotLayers;
  time?: number;
};

type SnapshotLayers = {
  vertices: geojson.FeatureCollection;
  edges: geojson.FeatureCollection;
  faces: geojson.FeatureCollection;
  features: geojson.FeatureCollection;
  staircaseRegions?: geojson.FeatureCollection;
};

type SnapShots = {
  [key: string]: Snapshot;
};

class Dcel {
  vertices: Map<string, Vertex>;
  halfEdges: Map<string, HalfEdge>;
  faces: Array<Face>;
  featureProperties: geojson.GeoJsonProperties;
  config: Config;
  snapShots: SnapShots;
  facefaceBoundaries?: FaceFaceBoundaries;

  constructor() {
    this.vertices = new Map();
    this.halfEdges = new Map();
    this.faces = [];
    this.featureProperties = {};
    this.config = undefined;
    this.snapShots = {};
    this.facefaceBoundaries = undefined;
  }

  /**
   * Creates a new Vertex and adds it to the DCEL.
   * @param x x coordinate of the new {@link Vertex}.
   * @param y y coordinate of the new {@link Vertex}.
   * @returns The created {@link Vertex}.
   */
  makeVertex(x: number, y: number): Vertex {
    const key = Vertex.getKey(x, y);
    if (this.vertices.has(key)) return this.vertices.get(key);

    const vertex = new Vertex(x, y, this);
    this.vertices.set(key, vertex);
    return vertex;
  }

  /**
   * Creates a new HalfEdge and adds it to the DCEL.
   * @param tail tail {@link Vertex} of the new {@link HalfEdge}.
   * @param head head {@link Vertex} of the new {@link HalfEdge}.
   * @returns The created HalfEdge.
   */
  makeHalfEdge(tail: Vertex, head: Vertex): HalfEdge {
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
  getFaces(): Array<Face> {
    return this.faces;
  }

  /**
   * Returns only the bounded Faces of the DCEL (the unbounded outer Face is not returned).
   * @returns An array of {@link Face}s.
   */
  getBoundedFaces(): Array<Face> {
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
  getHalfEdges(
    edgeClass?: OrientationClasses,
    simple = false,
    fromSignificant = false
  ): HalfEdge[] {
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

  removeVertex(vertex: Vertex): Map<string, Vertex> {
    const key = Vertex.getKey(vertex.x, vertex.y);
    this.vertices.delete(key);
    return this.vertices;
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
    this.createSnapshot(STEP.LOAD);
    this.splitEdges();
    this.createSnapshot(STEP.SUBDIVIDE);
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

  /**
   * Returns all Staircases of an DCEL.
   */
  // TODO: move this to a more specific (i.e. "cDCEL") class?
  getStaircases(): Staircase[] {
    return this.getHalfEdges()
      .filter((edge) => edge.staircase)
      .map((edge) => edge.staircase);
  }

  edgesToStaircases() {
    // create staircase for every pair of edges
    this.getHalfEdges(undefined, true).forEach((edge) => {
      if (edge.class === OrientationClasses.AB) return;
      if (
        edge.getSignificantVertex() !== undefined &&
        edge.getSignificantVertex() !== edge.getTail()
      )
        edge = edge.twin;
      edge.staircase = new Staircase(edge);
    });

    // calculate edgedistance and stepnumber for deviating edges first
    const staircasesOfDeviatingEdges = this.getStaircases().filter(
      (staircase) =>
        staircase.edge.class === OrientationClasses.AD ||
        staircase.edge.class === OrientationClasses.UD
    );
    this.getEdgeDistances(staircasesOfDeviatingEdges);
    this.getSe(
      staircasesOfDeviatingEdges.filter((staircase) => staircase.interferesWith.length > 0)
    );

    // calculate edgedistance and stepnumber for remaining edges
    const staircasesOther = this.getStaircases().filter(
      (staircase) =>
        staircase.edge.class !== OrientationClasses.AD &&
        staircase.edge.class !== OrientationClasses.UD
    );
    this.getEdgeDistances(staircasesOther);
    this.getSe(staircasesOther.filter((staircase) => staircase.interferesWith.length > 0));

    this.createSnapshot(STEP.STAIRCASE); // TODO: create one before and after? (for the reference of the staircaseRegions)

    // create the actual staircase in the DCEL
    this.replaceWithStaircases();
  }

  createSnapshot(name: STEP): Snapshot {
    const snapshot: Snapshot = {
      layers: {
        vertices: this.verticesToGeoJSON(),
        edges: this.edgesToGeoJSON(),
        faces: this.facesToGeoJSON(),
        features: this.toGeoJSON(),
      },
      time: undefined,
    };
    if (name === STEP.STAIRCASE)
      snapshot.layers.staircaseRegions = this.staircaseRegionsToGeoJSON();
    this.snapShots[name] = snapshot;
    return snapshot;
  }

  getEdgeDistances(staircases: Staircase[]) {
    // TODO: make sure the edgedistance cannot be too small? for topology error ("Must Be Larger Than Cluster tolerance"), when minimum distance between points to small
    // see: https://pro.arcgis.com/en/pro-app/latest/help/editing/geodatabase-topology-rules-for-polygon-features.htm

    // check if any point of a region is within another region
    for (const staircase of staircases) {
      const currentStaircaseIdx = staircases.indexOf(staircase);
      const staircasesToCompareWith = Array.from(staircases);
      staircasesToCompareWith.splice(currentStaircaseIdx, 1);
      staircasesToCompareWith.forEach((staircaseToCompareWith) => {
        if (staircase.region.every((point) => !point.isInPolygon(staircaseToCompareWith.region)))
          return;
        let e = staircase.edge;
        let e_ = staircaseToCompareWith.edge;
        if (
          e.getTail() !== e_.getTail() &&
          e.getTail() !== e_.getHead() &&
          e.getHead() !== e_.getHead() &&
          e.getHead() !== e_.getTail()
        ) {
          // "If the compared regions' edges do not have a vertex in common,
          // de is is simply the minimal distance between the edges."
          const de = e.distanceToEdge(e_);
          staircase.setEdgeDistance(de);
          return staircase.interferesWith.push(e_);
        } else {
          // "If e and e' share a vertex v, they interfere only if the edges reside in the same sector with respect to v."
          const v = e.getEndpoints().find((endpoint) => e_.getEndpoints().indexOf(endpoint) >= 0); // get common vertex
          e = e.getTail() !== v ? e.twin : e;
          e_ = e_.getTail() !== v ? e_.twin : e_;
          if (!e.getAssociatedSector().some((sector) => sector.encloses(e_.getAngle()))) return;
          staircase.interferesWith.push(e_);

          // "However, if e and e' do share a vertex, then we must again look at the classification."
          let de = undefined;
          switch (e.class) {
            case OrientationClasses.UB: {
              // "If e' is aligned, then we ignore a fraction of (1 − ε)/2 of e'."
              // "If e' is unaligned, then we ignore a fraction of e' equal to the length of the first step."
              // "In other words, we ignore a fraction of 1/(se' − 1) [of e']."
              if (e_.class === OrientationClasses.AD) {
                const offset = (1 - e.dcel.config.staircaseEpsilon) / 2;
                const vertexOffset = e.getOffsetVertex(e_, offset);
                de = vertexOffset.distanceToEdge(e);
              } else {
                const offset = 1 / (e_.staircase.se - 1);
                const vertexOffset = e.getOffsetVertex(e_, offset);
                de = vertexOffset.distanceToEdge(e);
              }
              break;
            }
            case OrientationClasses.E: {
              // "If e' is an evading edge, we ignore the first half of e (but not of e')."
              // "If e' is a deviating edge, we treat it as if e were an unaligned basic edge."
              if (e_.class === OrientationClasses.E) {
                const vertexOffset = e.getOffsetVertex(e, (e.getLength() * 1) / 2);
                de = vertexOffset.distanceToEdge(e_);
              } else {
                // AD or UD
                const offset = 1 / (e_.staircase.se - 1);
                const vertexOffset = e.getOffsetVertex(e_, offset);
                de = vertexOffset.distanceToEdge(e);
              }
              break;
            }
            case OrientationClasses.AD: {
              const offset = (1 - e.dcel.config.staircaseEpsilon) / 2;
              const vertexOffset = e.getOffsetVertex(e, offset);
              de = vertexOffset.distanceToEdge(e_);
              break;
            }
            case OrientationClasses.UD: {
              const vertexOffset = e.getOffsetVertex(e, (e.getLength() * 1) / 3);
              de = vertexOffset.distanceToEdge(e_);
              break;
            }
          }
          staircase.setEdgeDistance(de);
        }
      });
    }
  }

  getSe(staircases: Staircase[]) {
    for (const staircase of staircases) {
      const edge = staircase.edge;
      switch (edge.class) {
        case OrientationClasses.AD: {
          // "… we use δe = min{de/2,Δe}, where Δe = 0.1||e|| as defined for the staircase regions."
          if (staircase.de / 2 < staircase.deltaE) staircase.deltaE = staircase.de / 2;
          break;
        }
        case OrientationClasses.UD: {
          const maxVertices = staircase.points
            .slice(1, 2)
            .map((point) => new Vertex(point.x, point.y, null));
          const d1 = Math.min(...maxVertices.map((vertex) => vertex.distanceToEdge(edge)));
          let se = Math.ceil((2 * d1 * edge.getLength()) / staircase.de + 1);
          se = se % 2 === 0 ? se + 2 : se + 1; // TODO: check if this is correct? (p. 18)
          staircase.se = Math.max(4, se);
          break;
        }
        default: {
          // console.log("de", staircase.de);
          // "Let 𝛼1 denote the absolute angle between vector w−v and the assigned direction of e.
          // Similarly, 𝛼2 denotes the absolute angle between vector w − v and the other associated direction of e."
          const alpha1 = edge.getAngle() - edge.getAssociatedAngles()[0];
          const alpha2 = edge.getAssociatedAngles()[1] - edge.getAngle();
          const lmax =
            ((Math.pow(Math.tan(alpha1), -1) + Math.pow(Math.tan(alpha2), -1)) * staircase.de) / 2;
          let se = Math.ceil(edge.getLength() / lmax);
          staircase.se = se % 2 === 0 ? se + 2 : se + 1; // TODO: check if this is correct? (p. 18)
        }
      }
    }
  }

  replaceWithStaircases() {
    this.getHalfEdges()
      .filter((edge) => edge.staircase !== undefined)
      .forEach((edge) => {
        const stepPoints = edge.staircase.getStaircasePoints().slice(1, -1); // FIXME: use staircase.points here instead of method?
        let edgeToSubdivide = edge;
        for (let p of stepPoints)
          edgeToSubdivide = edgeToSubdivide.subdivide(new Point(p.x, p.y)).next;
      });

    // assign class AB to all edges of just created staircases
    this.getHalfEdges().forEach((edge) => (edge.class = OrientationClasses.AB));
  }

  constrainAngles(): void {
    this.classify();
    this.edgesToStaircases();
  }

  simplify(): Dcel {
    this.facefaceBoundaries = new FaceFaceBoundaries(this);
    this.createConfigurations();
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

  /**
   * Creates Configurations only for edges which endpoints are of degree 3 or less.
   */
  createConfigurations() {
    this.getHalfEdges().forEach((edge) => {
      if (edge.getEndpoints().every((vertex) => vertex.edges.length <= 3))
        edge.configuration = new Configuration(edge);
    });
  }
}

export default Dcel;
