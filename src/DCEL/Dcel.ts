import * as geojson from "geojson";
import config, {
  Config,
} from "../c-oriented-schematization/schematization.config";
import Configuration from "../c-oriented-schematization/Configuration";
import Contraction, {
  ContractionType,
} from "../c-oriented-schematization/Contraction";
import FaceFaceBoundaryList from "../c-oriented-schematization/FaceFaceBoundaryList";
import Staircase from "../c-oriented-schematization/Staircase";
import Point from "../geometry/Point";
import {
  createGeoJSON,
  geoJsonToGeometry,
  validateGeoJSON,
} from "../utilities";
import Face from "./Face";
import HalfEdge, { OrientationClasses } from "./HalfEdge";
import Vertex from "./Vertex";
import SnapshotList from "../Snapshot/SnapshotList";
import MultiPolygon from "../geometry/MultiPolygon";
import BoundingBox from "../helpers/BoundingBox";

export enum STEP {
  LOAD = "loadData",
  SUBDIVIDE = "subdivide",
  CLASSIFY = "classify",
  STAIRCASEREGIONS = "staircaseregions",
  STAIRCASE = "staircase",
  SIMPLIFY = "simplify",
}

class Dcel {
  name?: string;
  vertices: Map<string, Vertex>;
  halfEdges: Map<string, HalfEdge>;
  faces: Face[];
  featureProperties: geojson.GeoJsonProperties;
  config: Config;
  snapshotList: SnapshotList;
  faceFaceBoundaryList?: FaceFaceBoundaryList;
  created: number;

  constructor() {
    this.created = Date.now();
    this.vertices = new Map();
    this.halfEdges = new Map();
    this.faces = [];
    this.featureProperties = {};
    this.snapshotList = new SnapshotList(this);
    this.config = config;
  }

  /**
   * Creates a new Vertex and adds it to the DCEL.
   * @param x x coordinate of the new {@link Vertex}.
   * @param y y coordinate of the new {@link Vertex}.
   * @returns The created {@link Vertex}.
   */
  makeVertex(x: number, y: number): Vertex {
    const key = Vertex.getKey(x, y);
    const existingVertex = this.vertices.get(key);
    if (existingVertex) return existingVertex;

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
    const existingHalfEdge = this.halfEdges.get(key);
    if (existingHalfEdge) return existingHalfEdge;

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
    return this.faces.filter((f) => !f.isUnbounded);
  }

  /**
   * Returns the unbounded Face of the DCEL.
   * @returns The unbounded {@link Face}.
   */
  getUnboundedFace(): Face | undefined {
    return this.faces.find((f) => f.isUnbounded);
  }

  /**
   * Returns Halfedges of the DCEL.
   * @param edgeClass If set, only the {@link HalfEdge}s of this class will be returned.
   * @param simple If true, for every pair of {@link HalfEdge}s only one will be returned. false by default.
   * @param significantTail If true, for a pair of {@link HalfEdge}s which do have a significant {@link Vertex}, the one where the significant {@link Vertex} is the tail will be returned, default = false
   * @returns A (sub)set of {@link HalfEdge}s.
   */
  getHalfEdges(edgeClass?: OrientationClasses, simple = false): HalfEdge[] {
    const halfEdges = Array.from(this.halfEdges.values());
    let edges = edgeClass
      ? halfEdges.filter((e) => e.class === edgeClass)
      : halfEdges;
    edges = simple ? this.getSimpleEdges() : edges;
    return edges;
  }

  /**
   * Returns one {@link HalfEdge} of each pair of HalfEdges.
   */
  getSimpleEdges() {
    return Array.from(this.halfEdges.values()).reduce<HalfEdge[]>(
      (acc, edge) => {
        if (!edge.twin) return acc;
        const idx = acc.indexOf(edge.twin);
        if (idx < 0) acc.push(edge);
        return acc;
      },
      [],
    );
  }

  /**
   * Get all vertices of the DCEL.
   * @param significant A boolean indicating whether to return only significant vertices.
   * @returns An array of {@link Vertex|Vertices}.
   */
  getVertices(significant?: boolean) {
    if (significant)
      return Array.from(this.vertices.values()).filter(
        (v) => v.significant === significant,
      );
    return Array.from(this.vertices.values());
  }

  /**
   * Get the area of the DCEL.
   * Takes into account the area of all bounded faces and holes.
   * @returns The area of the DCEL.
   */
  get area(): number {
    return this.getFaces().reduce((acc, face) => {
      // do only consider faces associated with one feature
      // the unbounded faces (no associated features) need to be ignored
      // and faces which are holes and boundary (two associated features) can be ignored
      // as the area of the hole and the boundary cancel each other out
      if (face.associatedFeatures.length !== 1) return acc;
      const faceArea = face.getArea();
      if (faceArea) acc += faceArea * (face.isHole ? -1 : 1);
      return acc;
    }, 0);
  }

  /**
   * Find a {@link Vertex} within a DCEL, based on x and y coordinates.
   * @param x x Position
   * @param y y Position
   * @returns A {@link Vertex} if one exists on this position, otherwise undefined.
   */
  findVertex(x: number, y: number): Vertex | undefined {
    return this.vertices.get(Vertex.getKey(x, y));
  }

  /**
   * Find a {@link HalfEdge} within a DCEL, based on {@link Points} representing the tail and the head's position.
   * @param tailPos {@link Point} representing the position of the {@link HalfEdge}'s tail {@link Vertex}.
   * @param headPos {@link Point} representing the position of the {@link HalfEdge}'s head {@link Vertex}.
   * @returns A {@link HalfEdge}, inf one exists with this endpoint positions, otherwise undefined.
   */
  findHalfEdge(tailPos: Point, headPos: Point): HalfEdge | undefined {
    return this.getHalfEdges().find((edge) => {
      const edgeHeadPos = edge.getHead()?.toPoint();
      if (!edgeHeadPos) return;
      const edgeTailPos = edge.tail.toPoint();
      return edgeHeadPos.equals(headPos) && edgeTailPos.equals(tailPos);
    });
  }

  /**
   * Removes a {@link Vertex} from the DCEL.
   * @param vertex The {@link Vertex} to remove.
   * @returns The updated {@link Map} of the remaining {@link Vertex|Vertices}.
   */
  removeVertex(vertex: Vertex): Map<string, Vertex> {
    const key = Vertex.getKey(vertex.x, vertex.y);
    this.vertices.delete(key);
    return this.vertices;
  }

  /**
   * Removes a {@link HalfEdge} from the DCEL.
   * @param edge The {@link HalfEdge} to remove.
   * @returns The updated {@link Map} of the remaining {@link HalfEdge}s.
   */
  removeHalfEdge(edge: HalfEdge): Map<string, HalfEdge> {
    const head = edge.getHead();
    if (!head) return this.halfEdges;
    const edgeKey = HalfEdge.getKey(edge.tail, head);
    this.halfEdges.delete(edgeKey);
    if (edge.face && edge.twin?.face) {
      const boundaryKey = FaceFaceBoundaryList.getKey(
        edge.face,
        edge.twin.face,
      );
      const boundaryEdges =
        this.faceFaceBoundaryList?.boundaries.get(boundaryKey)?.edges;
      if (boundaryEdges && boundaryEdges.indexOf(edge) >= 0)
        boundaryEdges.splice(boundaryEdges.indexOf(edge), 1);
    }
    return this.halfEdges;
  }

  /**
   * Creates a Doubly Connected Edge List (DCEL) data structure from a geoJSON.
   * @param geoJSON a valid geojson with features of type 'Polygon' or 'Multipolygon'
   * @returns A {@link Dcel}.
   */
  static fromGeoJSON(
    geoJSON: geojson.FeatureCollection<geojson.Polygon | geojson.MultiPolygon>,
  ): Dcel {
    if (!validateGeoJSON(geoJSON)) throw new Error("invalid input");
    const geometry = geoJsonToGeometry(geoJSON);
    return Dcel.fromMultiPolygons(geometry);
  }

  /**
   * Creates a Doubly Connected Edge List (DCEL) data structure from a geoJSON.
   * @credits adapted from [cs.stackexchange.com](https://cs.stackexchange.com/questions/2450/how-do-i-construct-a-doubly-connected-edge-list-given-a-set-of-line-segments)
   * @param multiPolygons an array of {@link MultiPolygon}s.
   * @returns A {@link Dcel}.
   */
  static fromMultiPolygons(multiPolygons: MultiPolygon[]): Dcel {
    const subdivision = new Dcel();

    subdivision.featureProperties = multiPolygons.map((d) => d.properties);

    // convert Multipolygons to nested array of vertices (polygons)
    const polygons = multiPolygons.reduce((acc: Vertex[][][], multiPolygon) => {
      acc.push(
        ...multiPolygon.polygons.map((polygon) =>
          polygon.rings.map((ring) =>
            ring.points.map(
              (point) =>
                subdivision.findVertex(point.x, point.y) ||
                subdivision.makeVertex(point.x, point.y),
            ),
          ),
        ),
      );
      return acc;
    }, []);

    polygons.forEach((polygon) =>
      polygon.forEach((ring) => {
        ring.forEach((tail, idx) => {
          const head: Vertex = ring[(idx + 1) % ring.length];
          const halfEdge = subdivision.makeHalfEdge(tail, head);
          const twinHalfEdge = subdivision.makeHalfEdge(head, tail);
          halfEdge.twin = twinHalfEdge;
          twinHalfEdge.twin = halfEdge;
        });
      }),
    );

    // TODO: sort edges everytime a new edge is pushed to vertex.edges
    subdivision.vertices.forEach((vertex) => {
      // sort the half-edges whose tail vertex is that endpoint in clockwise order.
      vertex.sortEdges();

      // For every pair of half-edges e1, e2 in clockwise order, assign e1->twin->next = e2 and e2->prev = e1->twin.
      vertex.edges.forEach((e1, idx) => {
        const e2 = vertex.edges[(idx + 1) % vertex.edges.length];
        if (!e1.twin) return;
        e1.twin.next = e2;
        e2.prev = e1.twin;
      });
    });

    // For every cycle, allocate and assign a face structure.
    multiPolygons.forEach((multiPolygon, idx) => {
      const featureId = idx;

      let outerRingFace: Face;
      multiPolygon.polygons.forEach((polygon) =>
        polygon.rings.forEach((ring, idx) => {
          const [firstPoint, secondPoint] = ring.points;

          // find first edge of the ring
          const edge = subdivision.getHalfEdges().find((e) => {
            return (
              e.tail.x === firstPoint.x &&
              e.tail.y === firstPoint.y &&
              e.twin?.tail.x === secondPoint.x &&
              e.twin?.tail.y === secondPoint.y
            );
          });
          if (!edge) return;

          // check whether there's already a face related to this edge
          const existingFace = subdivision.faces.find((f) => f.edge === edge);
          // console.log({ existingFace, featureId, idx, edge: edge.toString() });
          // console.log({
          //   props: multiPolygon.properties,
          //   featureId,
          //   idx,
          //   existingFace,
          // });
          if (existingFace?.associatedFeatures) {
            existingFace.associatedFeatures.push(featureId);
          } else {
            if (idx === 0) {
              // only for outer ring
              outerRingFace = subdivision.makeFace();
              outerRingFace.associatedFeatures.push(featureId);
              edge?.getCycle().forEach((e) => (e.face = outerRingFace));
              outerRingFace.edge = edge;
            } else {
              const innerRingFace = subdivision.makeFace();
              innerRingFace.associatedFeatures.push(featureId);
              innerRingFace.outerRing = outerRingFace;

              edge.getCycle().forEach((e) => (e.face = innerRingFace));
              innerRingFace.edge = edge;
              if (!outerRingFace.innerEdges.length)
                outerRingFace.innerEdges = [];

              outerRingFace.innerEdges.push(edge);

              edge.twin?.getCycle().forEach((e) => (e.face = outerRingFace));
            }
          }
        }),
      );
    });

    // create unbounded Face (infinite outerFace) and assign it to edges which do not have a face yet
    const unboundedFace = subdivision.makeFace();
    while (subdivision.getHalfEdges().find((edge) => !edge.face)) {
      const outerEdge = subdivision.getHalfEdges().find((edge) => !edge.face);
      if (outerEdge) {
        outerEdge.getCycle().forEach((edge) => {
          edge.face = unboundedFace;
        });
      }
    }

    subdivision.setEpsilon(subdivision.config.lambda); // TODO: don't set config object on dcel's, rather use config as argument for respective methods
    return subdivision;
  }

  /**
   * Gets an array of Points making up the bounding box of the DCEL.
   * As seen from [turf.js](https://github.com/Turfjs/turf/blob/master/packages/turf-bbox/index.ts).
   * @returns The bounding box of the {@link Dcel} as [minX, minY, maxX, maxY].
   */
  get bBox() {
    const points = Array.from(this.vertices.values()).map(
      (v) => [v.x, v.y] as [number, number],
    );
    return new BoundingBox(points);
  }

  /**
   * Get the center of the polygon.
   * Defined as the center of it's Boundingbox
   */
  get center(): [number, number] {
    return this.bBox.center;
  }

  /**
   * Calculates the diameter of the DCEL (as the diameter of its bounding box).
   * @returns The diameter of the {@link Dcel}.
   */
  get diameter(): number {
    return this.bBox.diameter;
  }

  /**
   * Sets ε, a constant threshold for the maximum edge length within a DCEL, in the DCEL's config object.
   * @param lambda A constant factor.
   * @returns Epsilon. The maximum length of a {@link HalfEdge}.
   */
  setEpsilon(lambda: number): number | undefined {
    return this.config
      ? (this.config.epsilon = this.diameter * lambda)
      : undefined;
  }

  /**
   * Subdivide all edges of an DCEL so that no edges are longer than the defined threshold.
   * @param threshold
   * @returns A subdivided {@link Dcel}.
   */
  splitEdges(threshold = this.config?.epsilon): Dcel | undefined {
    if (!threshold) return;
    this.getBoundedFaces().forEach((f) => {
      const edges = f.getEdges();
      if (!edges) return;
      edges.forEach((e) => {
        e.subdivideToThreshold(threshold);
      });
    });
    return this;
  }

  preProcess(): void {
    this.snapshotList.takeSnapshot(STEP.LOAD);
    this.splitEdges();
    this.snapshotList.takeSnapshot(STEP.SUBDIVIDE);
  }

  /**
   * Classifies all Vertices in the DCEL, adds a new {@link Vertex} on an {@link HalfEdge} which has two significant Vertices.
   * By doing so it is guaranteed that every HalfEdge has at most one significant Vertex.
   */
  classifyVertices(): void {
    this.getVertices().forEach((v) => {
      v.isSignificant();
    });

    this.getHalfEdges(undefined, true).forEach((edge) => {
      const [tail, head] = edge.getEndpoints();
      if (tail.significant && head.significant) {
        const newPoint = edge.subdivide()?.getHead();
        if (newPoint) newPoint.significant = false;
      }
    });
  }

  /**
   * Classifies all {@link Halfedge|HalfEdges} in the DCEL.
   */
  classify(): void {
    this.classifyVertices();
    this.halfEdges.forEach((e) => e.classify());
    this.snapshotList.takeSnapshot(STEP.CLASSIFY);
  }

  /**
   * Returns all Staircases of an DCEL.
   */
  // TODO: move this to a more specific (i.e. "cDCEL") class?
  getStaircases(): Staircase[] {
    return this.getHalfEdges()
      .map((edge) => edge.staircase)
      .filter((staircase): staircase is Staircase => !!staircase);
  }

  /**
   * Creates {@link Staircase|Staircases} for all {@link HalfEdge}s in the DCEL.
   */
  addStaircases() {
    // for every pair of edges
    this.getHalfEdges(undefined, true).forEach((edge) => {
      // skip if they are already aligned
      if (edge.class === OrientationClasses.AB) return;
      //
      if (
        edge.getSignificantVertex() &&
        edge.getSignificantVertex() !== edge.tail &&
        edge.twin
      )
        edge = edge.twin;
      edge.staircase = new Staircase(edge);
    });
  }

  calculateStaircases() {
    // calculate edgedistance and stepnumber for deviating edges first (p. 18)
    const staircasesOfDeviatingEdges = this.getStaircases().filter(
      (staircase) =>
        staircase.edge.class === OrientationClasses.AD ||
        staircase.edge.class === OrientationClasses.UD,
    );
    this.setEdgeDistances(staircasesOfDeviatingEdges);
    this.setSes(
      staircasesOfDeviatingEdges.filter(
        (staircase) => staircase.interferesWith.length > 0,
      ),
    );

    // calculate edgedistance and stepnumber for remaining edges
    const staircasesOther = this.getStaircases().filter(
      (staircase) =>
        staircase.edge.class !== OrientationClasses.AD &&
        staircase.edge.class !== OrientationClasses.UD,
    );
    this.setEdgeDistances(staircasesOther);
    this.setSes(
      staircasesOther.filter(
        (staircase) => staircase.interferesWith.length > 0,
      ),
    );
  }

  setEdgeDistances(staircases: Staircase[]) {
    // TODO: make sure the edgedistance cannot be too small?
    // To account for topology error ("Must Be Larger Than Cluster tolerance"), when minimum distance between points is too small
    // see: https://pro.arcgis.com/en/pro-app/latest/help/editing/geodatabase-topology-rules-for-polygon-features.htm

    // check if any point of a region is within another staircase region
    for (const staircase of staircases) {
      staircases.forEach((staircase_) => {
        if (staircase_ === staircase) return;
        if (
          staircase.region.exteriorRing.points.every(
            (point) => !point.isInPolygon(staircase_.region),
          )
        )
          return;

        let e = staircase.edge;
        let e_ = staircase_.edge;
        const eStaircaseEpsilon = e.dcel.config.staircaseEpsilon;
        const e_staircaseSe = e_.staircase?.se;
        const eLength = e.getLength();
        if (
          e.tail !== e_.tail &&
          e.tail !== e_.getHead() &&
          e.getHead() !== e_.getHead() &&
          e.getHead() !== e_.tail
        ) {
          // "If the compared regions' edges do not have a vertex in common,
          // de is is simply the minimal distance between the edges."
          const de = e.distanceToEdge(e_);
          if (typeof de === "number") {
            staircase.de = de;
            staircase.interferesWith.push(e_);
          }
        } else {
          // "If e and e' share a vertex v, they interfere only if the edges reside in the same sector with respect to v."
          const v = e
            .getEndpoints()
            .find((endpoint) => e_.getEndpoints().indexOf(endpoint) >= 0); // get common vertex
          e = e.tail !== v && e.twin ? e.twin : e;
          e_ = e_.tail !== v && e_.twin ? e_.twin : e_;
          const e_angle = e_.getAngle();
          if (
            typeof e_angle !== "number" ||
            !e.getAssociatedSector().some((sector) => sector.encloses(e_angle))
          )
            return;
          staircase.interferesWith.push(e_);

          // "However, if e and e' do share a vertex, then we must again look at the classification."
          let de = undefined;
          switch (e.class) {
            case OrientationClasses.UB: {
              // "If e' is aligned, then we ignore a fraction of (1 − ε)/2 of e'."
              // "If e' is unaligned, then we ignore a fraction of e' equal to the length of the first step."
              // "In other words, we ignore a fraction of 1/(se' − 1) [of e']."
              if (e_.class === OrientationClasses.AD) {
                const offset = (1 - eStaircaseEpsilon) / 2;
                const vertexOffset = e.getOffsetVertex(e_, offset);
                de = vertexOffset?.distanceToEdge(e);
              } else {
                if (!e_staircaseSe) return;
                const offset = 1 / (e_staircaseSe - 1);
                const vertexOffset = e.getOffsetVertex(e_, offset);
                de = vertexOffset?.distanceToEdge(e);
              }
              break;
            }
            case OrientationClasses.E: {
              // "If e' is an evading edge, we ignore the first half of e (but not of e')."
              // "If e' is a deviating edge, we treat it as if e were an unaligned basic edge."
              if (typeof eLength !== "number") return;
              if (e_.class === OrientationClasses.E) {
                const vertexOffset = e.getOffsetVertex(e, (eLength * 1) / 2);
                de = vertexOffset?.distanceToEdge(e_);
              } else {
                // AD or UD
                if (typeof e_staircaseSe !== "number") return;
                const offset = 1 / (e_staircaseSe - 1);
                const vertexOffset = e.getOffsetVertex(e_, offset);
                de = vertexOffset?.distanceToEdge(e);
              }
              break;
            }
            case OrientationClasses.AD: {
              const offset = (1 - eStaircaseEpsilon) / 2;
              const vertexOffset = e.getOffsetVertex(e, offset);
              de = vertexOffset?.distanceToEdge(e_);
              break;
            }
            case OrientationClasses.UD: {
              if (typeof eLength !== "number") return;
              const vertexOffset = e.getOffsetVertex(e, (eLength * 1) / 3);
              de = vertexOffset?.distanceToEdge(e_);
              break;
            }
          }
          if (typeof de === "number") staircase.de = de;
        }
      });
    }
  }

  /**
   * Calculate and set se, defined as "the number of steps a {@link Staircase} must use"
   * for each staircase of a given array of staircases.
   * @param staircases
   * @returns
   */
  setSes(staircases: Staircase[]) {
    for (const staircase of staircases) {
      staircase.setSe();
    }
  }

  /**
   * Replaces all {@link HalfEdge|Halfedges} of the DCEL with {@link Staircase|Staircases}.
   */
  replaceEdgesWithStaircases() {
    this.getHalfEdges().forEach((edge) => {
      if (!edge.staircase) return;
      const stepPoints = edge.staircase.getStaircasePoints().slice(1, -1); // TODO: use .points instead
      let edgeToSubdivide = edge;
      for (const p of stepPoints) {
        const dividedEdge = edgeToSubdivide.subdivide(new Point(p.x, p.y));
        if (!dividedEdge) return;
        if (dividedEdge.next) edgeToSubdivide = dividedEdge.next;
      }
    });

    // assign class AB to all edges of just created staircases
    this.getHalfEdges().forEach((edge) => (edge.class = OrientationClasses.AB));
  }

  /**
   * Turn all {@link HalfEdge|Halfedges} of the DCEL into C-oriented {@link Staircase|Staircases}.
   */
  constrainAngles(): void {
    this.classify();
    this.addStaircases();
    this.calculateStaircases();
    this.snapshotList.takeSnapshot(STEP.STAIRCASEREGIONS);
    this.replaceEdgesWithStaircases();
    this.snapshotList.takeSnapshot(STEP.STAIRCASE);
  }

  /**
   * Iteratively simplifies the DCEL by complementary edge moves.
   * @returns The simplified DCEL.
   */
  simplify(): Dcel {
    this.removeSuperfluousVertices();
    const faceFaceBoundaryList = new FaceFaceBoundaryList(this);
    this.faceFaceBoundaryList = faceFaceBoundaryList;
    this.createConfigurations();
    // console.log(
    //   "before",
    //   [...this.faceFaceBoundaryList.boundaries].map(([k, v]) => v.edges.length),
    //   this.getArea()
    // );

    for (let index = 0; index < 0; index++) {
      const pair = this.faceFaceBoundaryList.getMinimalConfigurationPair();
      // console.log(
      //   pair?.contraction.configuration.innerEdge.toString(),
      //   pair?.contraction.area,
      //   pair?.contraction.point.xy()
      // );
      // console.log(pair?.compensation?.configuration.innerEdge.toString(), pair?.compensation?.area);

      pair?.doEdgeMove();
      // console.log("vertices: ", this.vertices.size, "edges: ", this.halfEdges.size / 2);
      // console.log(
      //   this.getBoundedFaces()[0]
      //     .getEdges()
      //     .map((e) => e.toString())
      // );
      // console.log("---------");
    }

    // while (pair || s.halfEdges.size/2 > k) {
    //   pair?.doEdgeMove();
    //   pair = this.faceFaceBoundaryList.getMinimalConfigurationPair();
    // }

    // console.log(
    //   "after",
    //   [...this.faceFaceBoundaryList.boundaries].map(([k, v]) => v.edges.length),
    //   this.getArea()
    // );
    this.snapshotList.takeSnapshot(STEP.SIMPLIFY);
    return this;
  }

  /**
   * Removes all vertices of the DCEL which are collinear, hence superfluous:
   * they can be removed without changing the visual geometry of the DCEL.
   */
  removeSuperfluousVertices(): void {
    const superfluousVertices = this.getVertices().filter((v) => {
      if (v.edges.length != 2) return false;
      const angle = v.edges
        .map((h) => h.getAngle() ?? Infinity)
        .reduce((acc, h) => Math.abs(acc - h), 0);
      // QUESTION: how to deal with precision for trigonometry in general?
      const hasOpposingEdges = Math.abs(Math.PI - angle) < 0.00000001;
      return hasOpposingEdges;
    });
    superfluousVertices.forEach((v) => v.remove());
  }

  /**
   * Schematizes the DCEL by first preprocessing it, then constraining angles and simplifying it.
   */
  schematize(): void {
    this.preProcess();
    this.constrainAngles();
    this.simplify();
  }

  /**
   * Prints the DCEL to the console.
   * @param verbose Boolean indicating whether to print the DCEL in a more detailed way.
   */
  toConsole(verbose: boolean = false): void {
    if (!verbose) console.log("DCEL " + this.name, this);
    else {
      console.log("🡒 START DCEL:", this);

      this.getFaces().forEach((f) => {
        console.log("→ new face", f.uuid);
        if (f.getEdges() != undefined) {
          //QUESTION: chris???
          f.getEdges().forEach((e) => {
            console.log(e, `(${e.tail.x},${e.tail.y})`);
          });
        }
      });
      console.log("🡐 DCEL END");
    }
  }

  /**
   * Transforms the DCEL into a geoJSON.
   * @returns A geoJSON FeatureCollection of MultiPolygons.
   */
  toGeoJSON(): geojson.FeatureCollection<geojson.MultiPolygon> {
    const outerRingsByFID = this.getBoundedFaces().reduce(
      (groupedFaces: { [key: number]: Face[] }, face) => {
        face.associatedFeatures.forEach((featureId, idx) => {
          if (face.outerRing && idx === 0) return groupedFaces; // TODO: why do we need this 0? for cases like vienna within noe
          if (groupedFaces[featureId]) groupedFaces[featureId].push(face);
          else groupedFaces[featureId] = [face];
        });
        return groupedFaces;
      },
      {},
    );

    const features = Object.values(outerRingsByFID).map(
      (feature: Face[], idx: number): geojson.Feature<geojson.MultiPolygon> => {
        let featureProperties: geojson.GeoJsonProperties = {};
        if (this.featureProperties)
          featureProperties =
            this.featureProperties[Object.keys(outerRingsByFID)[idx]];
        const featureCoordinates: number[][][][] = [];
        let ringIdx = 0;
        feature.forEach((ring: Face) => {
          const halfEdges = ring.getEdges();
          const coordinates = halfEdges.map((e) => [e.tail.x, e.tail.y]);
          coordinates.push([halfEdges[0].tail.x, halfEdges[0].tail.y]);
          featureCoordinates.push([coordinates]);
          if (ring.innerEdges.length) {
            const ringCoordinates: number[][][] = [];
            ring.innerEdges.forEach((innerEdge: HalfEdge) => {
              const halfEdges: HalfEdge[] = innerEdge.getCycle(false); // go backwards to go counterclockwise also for holes
              const coordinates: number[][] = halfEdges.map((e) => [
                e.tail.x,
                e.tail.y,
              ]);
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
      },
    );

    return createGeoJSON(features);
  }

  /**
   * Transforms the DCELs {@link Vertex|Vertices} into geoJSON.
   * @returns A geoJSON FeatureCollection of Points.
   */
  verticesToGeoJSON(): geojson.FeatureCollection<geojson.Point> {
    const vertexFeatures = Array.from(this.vertices.values()).map(
      (v): geojson.Feature<geojson.Point> => {
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
      },
    );

    return createGeoJSON(vertexFeatures);
  }

  /**
   * Transforms the DCELs {@link Face|Faces} into geoJSON.
   * @returns A geoJSON FeatureCollection of Polygons.
   */
  facesToGeoJSON(): geojson.FeatureCollection<geojson.Polygon> {
    const faceFeatures = this.getBoundedFaces().map(
      (f): geojson.Feature<geojson.Polygon> => {
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
            featureId: f.associatedFeatures,
            ringType: f.outerRing ? "inner" : "outer",
          },
        };
      },
    );

    return createGeoJSON(faceFeatures);
  }

  /**
   * Transforms the DCELs {@link HalfEdge|HalfEdges} into geoJSON.
   * @returns A geoJSON FeatureCollection of LineStrings.
   */
  staircasesToGeoJSON(): geojson.FeatureCollection<geojson.Polygon> {
    const staircaseFeatures = this.getHalfEdges(undefined, true).map(
      (edge): geojson.Feature<geojson.Polygon> => {
        const staircase: Staircase = new Staircase(edge);
        const coordinates: number[][] =
          staircase.region.exteriorRing.points.map((p) => [p.x, p.y]);
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
      },
    );
    return createGeoJSON(staircaseFeatures);
  }

  /**
   * Transforms the DCELs {@link HalfEdge|HalfEdges} into geoJSON.
   * @returns A geoJSON FeatureCollection of LineStrings.
   */
  edgesToGeoJSON(): geojson.FeatureCollection<geojson.LineString> {
    const edgeFeatures = this.getHalfEdges(undefined, true).map(
      (e): geojson.Feature<geojson.LineString> => {
        const a = e.tail;
        const b = e.twin?.tail;
        const coordinates = // QUESTION: does it make sense to return an empty set of coordinates if head is not defined?
          a && b
            ? [
                [a.x, a.y],
                [b.x, b.y],
              ]
            : [];

        return {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: coordinates,
          },
          properties: {
            incidentFaceType: e.face?.outerRing ? "inner" : "outer",
            length: e.getLength(),
            sector: e.getAssociatedSector(),
            class: e.class,
            assignedDirection: e.assignedDirection,
            configuration: e.configuration,
            twinClass: e.twin?.class,
            // TODO: move this to mapoutput!
            edge: `
              <span class="material-icons">rotate_left</span>
              ${e.getUuid(5)} (${e.tail.x}/${e.tail.y})
              <span class="material-icons">arrow_forward</span>
              (${e.twin?.tail.x}/${e.twin?.tail.y})
              <span class="material-icons">highlight_alt</span> ${e.face?.getUuid(
                5,
              )}
              ${e.class}
              ${e.assignedDirection}
              `,
            twin: `
              <span class="material-icons">rotate_right</span>
              ${e.twin?.getUuid(5)} (${e.twin?.tail.x}/${e.twin?.tail.y})
              <span class="material-icons">arrow_back</span>
              (${e.tail.x}/${e.tail.y})
              <span class="material-icons">highlight_alt</span> ${e.twin?.face?.getUuid(
                5,
              )}
              ${e.twin?.class}
              ${e.twin?.assignedDirection}
              `,
          },
        };
      },
    );

    return createGeoJSON(edgeFeatures);
  }
  /**
   * Transforms the DCELs {@link Staircase}'s regions into geoJSON.
   * @returns A geoJSON FeatureCollection of Polygons.
   */
  staircaseRegionsToGeoJSON(): geojson.FeatureCollection<geojson.Polygon> {
    const regionFeatures = this.getStaircases().map(
      (staircase): geojson.Feature<geojson.Polygon> => {
        const region = staircase.region.exteriorRing;
        // add first Point to close geoJSON polygon
        region.points.push(region.points[0]);

        return {
          type: "Feature",
          properties: {
            uuid: staircase.edge.uuid,
            class: staircase.edge.class,
            interferesWith: staircase.interferesWith
              .map((e) => e.getUuid(5))
              .join(" ,"),
          },
          geometry: {
            type: "Polygon",
            coordinates: [region.points.map((p) => [p.x, p.y])],
          },
        };
      },
    );
    return createGeoJSON(regionFeatures);
  }

  /**
   * Gets all contractions within a DCEL.
   * @returns An array of {@link Contraction}s.
   */
  getContractions(): Contraction[] {
    return this.getHalfEdges().reduce((acc: Contraction[], edge) => {
      if (!edge.configuration) return acc;
      const n = edge.configuration[ContractionType.N];
      const p = edge.configuration[ContractionType.P];
      if (n) acc.push(n);
      if (p) acc.push(p);
      return acc;
    }, []);
  }

  /**
   * Creates Configurations for all valid edges.
   */
  createConfigurations() {
    this.getHalfEdges().forEach((edge) => {
      if (edge.getEndpoints().every((vertex) => vertex.edges.length <= 3))
        edge.configuration = new Configuration(edge);
    });
  }
}

export default Dcel;
