import * as geojson from "geojson";
import { EPSILON } from "../geometry/constants";
import MultiPolygon from "../geometry/MultiPolygon";
import Point from "../geometry/Point";
import Polygon from "../geometry/Polygon";
import Ring from "../geometry/Ring";
import Subdivision, { Coordinates } from "../geometry/Subdivision";
import BoundingBox from "../helpers/BoundingBox";
import { geoJsonToGeometry, validateGeoJSON } from "../utilities";
import Face from "./Face";
import HalfEdge from "./HalfEdge";
import Vertex from "./Vertex";

class Dcel {
  name?: string;
  // Vertices are stored by numeric id; use `vertexBuckets` for spatial lookup
  vertices: Map<number, Vertex>;
  halfEdges: Map<string, HalfEdge>;
  faces: Face[];
  featureProperties: geojson.GeoJsonProperties;
  nextVertexId: number;
  nextHalfEdgeId: number;
  nextFaceId: number;
  // Fixed-size-hash-with-buckets spatial index for coordinate lookups
  vertexBuckets: Map<string, Vertex[]>;

  constructor() {
    this.vertices = new Map();
    this.halfEdges = new Map();
    this.faces = [];
    this.featureProperties = {};
    this.nextVertexId = 1;
    this.nextHalfEdgeId = 1;
    this.nextFaceId = 1;
    this.vertexBuckets = new Map();
  }

  /**
   * Creates a new Vertex and adds it to the DCEL.
   * @param x x coordinate of the new {@link Vertex}.
   * @param y y coordinate of the new {@link Vertex}.
   * @returns The created {@link Vertex}.
   */
  addVertex(x: number, y: number) {
    const bucketKey = this.coordHash(x, y);
    const bucket = this.vertexBuckets.get(bucketKey) ?? [];
    const existing = bucket.find((v) => v.x === x && v.y === y);
    if (existing) return existing;

    const vertex = new Vertex(x, y, this);
    vertex.id = this.nextVertexId++;
    this.vertices.set(vertex.id, vertex);
    bucket.push(vertex);
    this.vertexBuckets.set(bucketKey, bucket);
    return vertex;
  }

  /**
   * Creates a new HalfEdge and adds it to the DCEL.
   * @param tail tail {@link Vertex} of the new {@link HalfEdge}.
   * @param head head {@link Vertex} of the new {@link HalfEdge}.
   * @returns The created HalfEdge.
   */
  addHalfEdge(tail: Vertex, head: Vertex) {
    const key = HalfEdge.getKey(tail, head);
    const existingHalfEdge = this.halfEdges.get(key);
    if (existingHalfEdge) return existingHalfEdge;

    const halfEdge = new HalfEdge(tail, this);
    halfEdge.id = this.nextHalfEdgeId++;
    this.halfEdges.set(key, halfEdge);
    tail.edges.push(halfEdge);
    tail.sortEdges();
    return halfEdge;
  }

  /**
   * Creates a new Face and adds it to the DCEL.
   * @returns The created {@link Face}.
   */
  addFace() {
    const face = new Face();
    face.id = this.nextFaceId++;
    this.faces.push(face);
    return face;
  }

  /**
   * Register some existing {@link Vertex} instance with this DCEL.
   * Assigns a numeric id if missing and adds it to buckets/map.
   */
  registerVertex(vertex: Vertex) {
    const bucketKey = this.coordHash(vertex.x, vertex.y);
    const bucket = this.vertexBuckets.get(bucketKey) ?? [];
    const existing = bucket.find((v) => v.x === vertex.x && v.y === vertex.y);
    if (existing) return existing.id;

    // assign id if missing
    if (vertex.id === undefined) {
      vertex.id = this.nextVertexId++;
    } else {
      // validate provided id
      if (!Number.isInteger(vertex.id) || vertex.id <= 0)
        throw new Error(`Invalid vertex id ${vertex.id}`);
      if (this.vertices.has(vertex.id))
        throw new Error(`Vertex id ${vertex.id} is already registered`);
    }

    vertex.dcel = this;
    this.vertices.set(vertex.id, vertex);
    bucket.push(vertex);
    this.vertexBuckets.set(bucketKey, bucket);
    return vertex.id;
  }

  /**
   * Register some existing {@link HalfEdge} instance with this DCEL.
   * Ensures its endpoints are registered, assigns an id if missing and
   * inserts the half-edge into the DCEL halfEdges map and the tail's edges.
   */
  registerHalfEdge(edge: HalfEdge) {
    // Determine head (may come from twin)
    const head = edge.head ?? edge.twin?.tail;
    if (!head)
      throw new Error(
        "registerHalfEdge: cannot register halfedge without head",
      );

    // ensure endpoints are registered
    this.registerVertex(edge.tail);
    this.registerVertex(head);

    const key = HalfEdge.getKey(edge.tail, head);
    const existing = this.halfEdges.get(key);
    if (existing) return existing.id;

    // assign id if missing, otherwise validate and ensure uniqueness
    if (edge.id === undefined) {
      edge.id = this.nextHalfEdgeId++;
    } else {
      if (!Number.isInteger(edge.id) || edge.id <= 0)
        throw new Error(`Invalid halfedge id ${edge.id}`);
      for (const he of this.halfEdges.values()) {
        if (he.id === edge.id)
          throw new Error(`HalfEdge id ${edge.id} is already registered`);
      }
    }

    edge.dcel = this;
    this.halfEdges.set(key, edge);
    if (edge.tail.edges.indexOf(edge) === -1) edge.tail.edges.push(edge);
    edge.tail.sortEdges();

    // Ensure twin is registered too (but avoid infinite recursion)
    if (edge.twin) {
      const twinKey = HalfEdge.getKey(
        edge.twin.tail,
        edge.twin.head ?? edge.tail,
      );
      if (!this.halfEdges.get(twinKey)) {
        if (!(typeof edge.twin.id === "number" && edge.twin.id > 0))
          edge.twin.id = this.nextHalfEdgeId++;
        edge.twin.dcel = this;
        this.halfEdges.set(twinKey, edge.twin);
        if (edge.twin.tail.edges.indexOf(edge.twin) === -1)
          edge.twin.tail.edges.push(edge.twin);
        edge.twin.tail.sortEdges();
      }
      edge.twin.twin = edge;
      edge.twin.dcel = this;
    }

    return edge.id;
  }

  /**
   * Register some existing {@link Face} instance with this DCEL.
   */
  registerFace(face: Face) {
    // idempotent: if face already registered, return its id
    if (this.faces.includes(face)) return face.id;

    if (face.id === undefined) {
      face.id = this.nextFaceId++;
    } else {
      if (!Number.isInteger(face.id) || face.id <= 0)
        throw new Error(`Invalid face id ${face.id}`);
      // Ensure no other face uses this id
      if (this.faces.some((f) => f !== face && f.id === face.id))
        throw new Error(`Face id ${face.id} is already registered`);
    }
    this.faces.push(face);
    return face.id;
  }

  /**
   * Gets all Faces of the DCEL.
   * @returns An array of {@link Face}s.
   */
  getFaces() {
    return this.faces;
  }

  /**
   * Returns only the bounded Faces of the DCEL (the unbounded outer Face is not returned).
   * @returns An array of {@link Face}s.
   */
  getBoundedFaces() {
    return this.faces.filter(Face.isBounded);
  }

  /**
   * Returns the unbounded Face of the DCEL.
   * @returns The unbounded {@link Face}.
   */
  getUnboundedFace() {
    return this.faces.find((f) => f.isUnbounded);
  }

  /**
   * Returns Halfedges of the DCEL.
   * @param simple If true, for every pair of {@link HalfEdge}s only one will be returned. false by default.
   * @returns A (sub)set of {@link HalfEdge}s.
   */
  getHalfEdges(simple = false) {
    const halfEdges = Array.from(this.halfEdges.values());
    const edges = simple ? this.getSimpleEdges(halfEdges) : halfEdges;
    return edges;
  }

  /**
   * Returns the simple {@link HalfEdge}s of the DCEL.
   * @param edges The {@link HalfEdge}s to check for simplicity.
   * @returns A (sub)set of {@link HalfEdge}s.
   */
  getSimpleEdges(edges: HalfEdge[]) {
    // FIXME: confusing for map output:
    // sometimes clockwise/counterclockwise assignment in map output wrong
    const simpleEdges: HalfEdge[] = [];
    const seen = new Set<HalfEdge>();
    edges.forEach((e) => {
      if (!e.twin || seen.has(e.twin)) return;
      seen.add(e);
      simpleEdges.push(e);
    });
    return simpleEdges;
  }

  /**
   * Returns the Vertices of the DCEL.
   * @param significant If true, only the significant {@link Vertex}s will be returned.
   * @returns A (sub)set of {@link Vertex}s.
   */
  getVertices() {
    return [...this.vertices.values()];
  }

  /**
   * Returns the area enclosed by the DCEL.
   * @returns The area of the DCEL.
   */
  getArea() {
    return this.getFaces().reduce((acc, face) => {
      // Do only consider faces associated with one feature.
      // The unbounded faces (no associated features) need to be ignored.
      // Faces which are holes and boundary (two associated features) can be ignored
      // as the area of the hole and the boundary cancel each other out
      if (face.associatedFeatures.length !== 1) return acc;
      const faceArea = face.getArea();
      if (faceArea) acc += faceArea * (face.isHole ? -1 : 1);
      return acc;
    }, 0);
  }

  /**
   * Find a Vertex within a DCEL, based on x and y coordinates.
   * @param x x Position
   * @param y y Position
   * @returns A {@link Vertex} if one exists on this position, otherwise undefined.
   */
  findVertex(x: number, y: number) {
    const bucketKey = this.coordHash(x, y);
    const bucket = this.vertexBuckets.get(bucketKey);
    if (!bucket) return undefined;
    return bucket.find((v) => v.x === x && v.y === y);
  }

  /**
   * Find a HalfEdge within a DCEL, based on Points representing the tail and the head's position.
   * @param tailPos {@link Point} representing the position of the {@link HalfEdge}'s tail {@link Vertex}.
   * @param headPos {@link Point} representing the position of the {@link HalfEdge}'s head {@link Vertex}.
   * @returns A {@link HalfEdge}, if one exists with this endpoint positions, otherwise undefined.
   */
  findHalfEdge(tailPos: Point, headPos: Point) {
    return this.getHalfEdges().find((edge) => {
      const edgeHeadPos = edge.head?.toPoint();
      if (!edgeHeadPos) return;
      const edgeTailPos = edge.tail.toPoint();
      return edgeHeadPos.equals(headPos) && edgeTailPos.equals(tailPos);
    });
  }

  /**
   * Removes the {@link Vertex} from the DCEL.
   * @param vertex The {@link Vertex} to remove.
   * @returns The remaining {@link Vertex|Vertices} in the DCEL.
   */
  removeVertex(vertex: Vertex) {
    // remove from id map
    if (typeof vertex.id === "number" && vertex.id > 0)
      this.vertices.delete(vertex.id);

    // remove from bucket index
    const bucketKey = this.coordHash(vertex.x, vertex.y);
    const bucket = this.vertexBuckets.get(bucketKey);
    if (bucket) {
      const idx = bucket.indexOf(vertex);
      if (idx > -1) bucket.splice(idx, 1);
      if (bucket.length === 0) this.vertexBuckets.delete(bucketKey);
    }
    return this.vertices;
  }

  /**
   * Update internal spatial and compatibility maps when a vertex moves position.
   */
  updateVertexPosition(
    vertex: Vertex,
    oldX: number,
    oldY: number,
    newX: number,
    newY: number,
  ) {
    const oldBucketKey = this.coordHash(oldX, oldY);
    const oldBucket = this.vertexBuckets.get(oldBucketKey);
    if (oldBucket) {
      const idx = oldBucket.indexOf(vertex);
      if (idx > -1) oldBucket.splice(idx, 1);
      if (oldBucket.length === 0) this.vertexBuckets.delete(oldBucketKey);
    }

    const newBucketKey = this.coordHash(newX, newY);
    const newBucket = this.vertexBuckets.get(newBucketKey) ?? [];
    newBucket.push(vertex);
    this.vertexBuckets.set(newBucketKey, newBucket);
    return vertex;
  }

  /**
   * Removes the {@link HalfEdge} from the DCEL.
   * @param edge The {@link HalfEdge} to remove.
   * @returns The remaining {@link HalfEdge}s in the DCEL.
   */
  removeHalfEdge(edge: HalfEdge) {
    // Given up here rather than by whoever removes the edge: this is the one way out
    // of the Dcel, so a face cannot be left holding a gone edge as the start of one
    // of its holes, whichever path removed it.
    const enclosing = edge.face?.outerRing;
    if (enclosing) {
      // A hole is reached through one of its edges, so a hole which outlives the one
      // it is reached through is handed over to the next edge along it.
      const following = edge.next;
      // Only for an edge which has collapsed onto itself: a hole reached through one
      // is reached through nothing, while its ring goes on. Edges removed with a
      // length to them are replaced by whoever removes them.
      const outlives =
        !!edge.head &&
        edge.tail.equals(edge.head) &&
        enclosing.innerEdges.includes(edge) &&
        following &&
        following !== edge &&
        following !== edge.twin &&
        following.face === edge.face;
      if (outlives && following) enclosing.replaceInnerEdge(edge, following);
      else enclosing.removeInnerEdge(edge);
    }

    const head = edge.head;
    if (!head) return this.halfEdges;

    // Try to remove using the numeric-ID-based key first
    const edgeKey = HalfEdge.getKey(edge.tail, head);
    let deleted = this.halfEdges.delete(edgeKey);

    // If that failed, try removing by coordinate-based key (for degenerate or merged edges)
    if (!deleted && edge.coordKey) {
      deleted = this.halfEdges.delete(edge.coordKey);
    }

    // If still not deleted, search through all keys as a last resort
    if (!deleted) {
      for (const key of this.halfEdges.keys()) {
        const storedEdge = this.halfEdges.get(key);
        if (storedEdge === edge) {
          this.halfEdges.delete(key);
          deleted = true;
          break;
        }
      }
    }

    if (
      process.env.NODE_ENV !== "production" &&
      process.env.VERBOSE_DEBUG &&
      !deleted
    ) {
      console.warn(
        "removeHalfEdge: Could not find edge to remove:",
        edge.coordKey,
      );
    }

    if (edge.face && edge.twin?.face) {
      // const boundaryKey = FaceFaceBoundaryList.getKey(
      //   edge.face,
      //   edge.twin.face,
      // );
      // this needs to be moved
      // to a c-oriente-schematization class (e.g. to the edge move processor?)
      // const boundaryEdges =
      //   this.faceFaceBoundaryList?.boundaries.get(boundaryKey)?.edges;
      // if (boundaryEdges && boundaryEdges.indexOf(edge) >= 0)
      //   boundaryEdges.splice(boundaryEdges.indexOf(edge), 1);
    }
    return this.halfEdges;
  }

  // Simple DJB2 hash of coordinate string, returned as hex (bounded length)
  private coordHash(x: number, y: number) {
    const s = `${x},${y}`;
    let h = 5381;
    for (let i = 0; i < s.length; i++) {
      h = (h * 33) ^ s.charCodeAt(i);
    }
    // convert to unsigned and hex
    return (h >>> 0).toString(16);
  }

  /**
   * Creates a Doubly Connected Edge List (DCEL) data structure from a geoJSON.
   * @param geoJSON a valid geojson with features of type 'Polygon' or 'Multipolygon'
   * @returns A {@link Dcel}.
   */
  static fromGeoJSON(
    geoJSON: geojson.FeatureCollection<geojson.Polygon | geojson.MultiPolygon>,
  ) {
    if (!validateGeoJSON(geoJSON)) throw new Error("invalid input");
    const geometry = geoJsonToGeometry(geoJSON);
    return this.fromSubdivision(geometry);
  }

  /**
   * Creates a Doubly Connected Edge List (DCEL) data structure from a geoJSON.
   * @credits adapted from [cs.stackexchange.com](https://cs.stackexchange.com/questions/2450/how-do-i-construct-a-doubly-connected-edge-list-given-a-set-of-line-segments)
   * @param multiPolygons an array of {@link MultiPolygon}s.
   * @returns A {@link Dcel}.
   */
  static fromSubdivision(subdivision: Subdivision) {
    const dcel = new Dcel();

    dcel.featureProperties = subdivision.multiPolygons.map((d) => d.properties);

    // Convert multiPolygons to nested array of vertices (polygons)
    const polygons = subdivision.multiPolygons.reduce(
      (acc: Vertex[][][], multiPolygon) => {
        acc.push(
          ...multiPolygon.polygons.map((polygon) =>
            polygon.rings.map((ring) =>
              ring.points
                .slice(0, -1)
                .map(
                  (point) =>
                    dcel.findVertex(point.x, point.y) ||
                    dcel.addVertex(point.x, point.y),
                ),
            ),
          ),
        );
        return acc;
      },
      [],
    );

    polygons.forEach((polygon) =>
      polygon.forEach((ring) => {
        ring.forEach((tail, idx) => {
          const head: Vertex = ring[(idx + 1) % ring.length];
          const halfEdge = dcel.addHalfEdge(tail, head);
          const twinHalfEdge = dcel.addHalfEdge(head, tail);
          halfEdge.twin = twinHalfEdge;
          twinHalfEdge.twin = halfEdge;
        });
      }),
    );

    // TO-DO: sort edges every time a new edge is pushed to vertex.edges
    dcel.vertices.forEach((vertex) => {
      // Sort the half-edges whose tail vertex is that endpoint in clockwise order.
      vertex.sortEdges();

      // For every pair of half-edges e1, e2 in clockwise order, assign e1->twin->next = e2 and e2->previous = e1->twin.
      vertex.edges.forEach((e1, idx) => {
        const e2 = vertex.edges[(idx + 1) % vertex.degree];
        if (!e1.twin) return;
        e1.twin.next = e2;
        e2.prev = e1.twin;
      });
    });

    // For every cycle, allocate and assign a face structure.
    subdivision.multiPolygons.forEach((multiPolygon, idx) => {
      const featureId = idx;

      let outerRingFace: Face;
      multiPolygon.polygons.forEach((polygon) =>
        polygon.rings.forEach((ring, idx) => {
          const [firstPoint, secondPoint] = ring.points;

          // Find first edge of the ring.
          // Looked up via the ring's first vertex rather than by scanning
          // every half-edge, which allocated a fresh array of all of them for
          // each ring.
          const tail = dcel.findVertex(firstPoint.x, firstPoint.y);
          const edge = tail?.edges.find(
            (e) =>
              e.twin?.tail.x === secondPoint.x &&
              e.twin?.tail.y === secondPoint.y,
          );
          if (!edge) return;

          // Check whether this directed cycle already carries a face. Matching
          // on `f.edge === edge` alone missed enclaves whose ring and hole ring
          // no longer start at the same vertex after being subdivided.
          const existingFace =
            edge.face ?? dcel.faces.find((f) => f.edge === edge);
          if (existingFace?.associatedFeatures) {
            existingFace.associatedFeatures.push(featureId);
            // The ring already has a face, because it is also a feature in its
            // own right — an enclave such as San Marino within Italy. The hole
            // bookkeeping still has to happen, or the enclosing face gets no
            // inner ring and the enclave, having no `outerRing`, is reported
            // as a polygon rather than a hole.
            if (idx === 0) {
              outerRingFace = existingFace;
            } else if (outerRingFace) {
              existingFace.outerRing = outerRingFace;
              outerRingFace.innerEdges.push(edge);
              // Without this the hole's outward-facing cycle keeps no face and
              // the fallback below hands it to the unbounded face.
              edge.twin?.getCycle().forEach((e) => (e.face = outerRingFace));
            }
          } else {
            if (idx === 0) {
              // only for outer ring
              outerRingFace = dcel.addFace();
              outerRingFace.associatedFeatures.push(featureId);
              edge?.getCycle().forEach((e) => (e.face = outerRingFace));
              outerRingFace.edge = edge;
            } else {
              const innerRingFace = dcel.addFace();
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

    // Create unbounded Face (infinite outer face) and assign it to edges which do not have a face yet
    const unboundedFace = dcel.addFace();
    while (dcel.getHalfEdges().find((edge) => !edge.face)) {
      const outerEdge = dcel.getHalfEdges().find((edge) => !edge.face);
      if (outerEdge) {
        outerEdge.getCycle().forEach((edge) => {
          edge.face = unboundedFace;
        });
      }
    }

    return dcel;
  }

  /**
   * Creates a Doubly Connected Edge List (DCEL) data structure from a list of coordinates.
   * @param coordinates A list of coordinates representing the subdivision.
   * @returns A {@link Dcel}.
   */
  static fromCoordinates(coordinates: Coordinates) {
    const subdivision = Subdivision.fromCoordinates(coordinates);
    return this.fromSubdivision(subdivision);
  }

  /**
   * Gets an array of Points making up the bounding box of the DCEL.
   * As seen from [turf.js](https://github.com/Turfjs/turf/blob/master/packages/turf-bbox/index.ts).
   * @returns The bounding box of the {@link Dcel} as [minX, minY, maxX, maxY].
   */
  getBbox() {
    const points = Array.from(this.vertices.values()).map(
      (v) => [v.x, v.y] as [number, number],
    );
    return new BoundingBox(points);
  }

  /**
   * Gets the DCEL's center.
   * Defined as the center of it's BoundingBox
   * @returns The center of the {@link Dcel}.
   */
  get center() {
    return this.getBbox().center;
  }

  /**
   * Calculates the diameter of the DCEL (as the diameter of its bounding box).
   * @returns The diameter of the {@link Dcel}.
   */
  getDiameter() {
    return this.getBbox().diameter;
  }

  /**
   * Transform the DCEL into a {@link Subdivision}.
   * @returns A {@link Subdivision} representation of the {@link DCEL}.
   */
  toSubdivision() {
    const multiPolygons = this.facesByFeature.map(
      ({ id: featureId, faces }) => {
        const polygons = faces
          ?.filter(
            (face) =>
              !face.isHole ||
              // TO-DO: think of a clever condition which excludes rings which are inner holes for the respective ring
              (face.isHole &&
                face.outerRing &&
                !faces.map(({ id }) => id).includes(face.outerRing?.id)),
          )
          .map(
            (face) =>
              new Polygon(
                face
                  .getRings()
                  .map(
                    (ring) => new Ring(ring.map(({ tail }) => tail.toPoint())),
                  ),
              ),
          );

        const properties = this.featureProperties?.at(featureId);

        const multiPolygon = new MultiPolygon(
          polygons ?? [],
          featureId,
          properties,
        );
        return multiPolygon;
      },
    );

    return new Subdivision(multiPolygons);
  }

  /**
   * Get the faces of the DCEL grouped by their associated feature.
   * It only considers bounded faces.
   * @returns An object with the associated feature id as key and an array of associated {@link Face}s as value.
   */
  private get facesByFeature() {
    const explodedFaces = this.getBoundedFaces().flatMap((face) =>
      face.associatedFeatures.flatMap((id) => ({ id, face })),
    );
    const groups = Object.groupBy(explodedFaces, ({ id }) => id);
    return Object.entries(groups).map(([id, faces]) => ({
      id: Number(id),
      faces: faces?.map(({ face }) => face),
    }));
  }

  /**
   * Clone the DCEL.
   * @returns A deep copy of the DCEL.
   */
  public clone() {
    // Create a fresh DCEL from the subdivision representation
    const clone = this.toSubdivision().toDcel();

    // Map original vertices by coordinate -> id
    const origVertexIdByCoord = new Map<string, number>();
    this.getVertices().forEach((v) => {
      if (typeof v.id === "number" && v.id > 0)
        origVertexIdByCoord.set(Vertex.getKey(v.x, v.y), v.id);
    });

    // Reassign ids on cloned vertices to match original where possible
    const newVertices = new Map<number, Vertex>();
    clone.getVertices().forEach((v) => {
      const key = Vertex.getKey(v.x, v.y);
      const origId = origVertexIdByCoord.get(key);
      if (typeof origId === "number" && origId > 0) v.id = origId;
      else v.id = clone.nextVertexId++;
      newVertices.set(v.id, v);
    });
    clone.vertices = newVertices;

    // Map original half-edges by tail->head coordinate key -> id
    const origEdgeIdByCoords = new Map<string, number>();
    this.getHalfEdges().forEach((e) => {
      const t = e.tail;
      const h = e.head;
      if (t && h && typeof e.id === "number" && e.id > 0) {
        origEdgeIdByCoords.set(`${HalfEdge.getKey(t, h)}`, e.id);
      }
    });

    // Reassign ids on cloned half-edges and rebuild halfEdges map
    const newHalfEdges = new Map<string, HalfEdge>();
    clone.getHalfEdges().forEach((e) => {
      const t = e.tail;
      const h = e.head;
      if (!t || !h) return;
      const coordsKey = `${HalfEdge.getKey(t, h)}`;
      const origId = origEdgeIdByCoords.get(coordsKey);
      if (typeof origId === "number" && origId > 0) e.id = origId;
      else e.id = clone.nextHalfEdgeId++;
      const key = HalfEdge.getKey(t, h);
      newHalfEdges.set(key, e);
    });
    clone.halfEdges = newHalfEdges;

    // Map original faces by an identifying edge coordinate (if available) -> id
    const origFaceIdByEdgeCoords = new Map<string, number>();
    this.getBoundedFaces().forEach((f) => {
      const e = f.edge;
      if (!e || !(typeof f.id === "number" && f.id > 0)) return;
      const t = e.tail;
      const h = e.head;
      if (!t || !h) return;
      origFaceIdByEdgeCoords.set(`${HalfEdge.getKey(t, h)}`, f.id);
    });

    // Reassign ids on cloned faces where possible
    clone.faces.forEach((f) => {
      const e = f.edge;
      if (!e) return;
      const t = e.tail;
      const h = e.head;
      if (!t || !h) return;
      const coordsKey = `${HalfEdge.getKey(t, h)}`;
      const origId = origFaceIdByEdgeCoords.get(coordsKey);
      if (typeof origId === "number" && origId > 0) f.id = origId;
      else f.id = clone.nextFaceId++;
    });

    return clone;
  }

  /**
   * Merges two vertices if they are at the same position.
   * All incident edges of v2 are reassigned to v1, and v2 is removed from the DCEL.
   * @param v1 The vertex to keep.
   * @param v2 The vertex to merge and remove.
   * @returns The merged vertex (v1).
   */
  mergeVertices(v1: Vertex, v2: Vertex): Vertex {
    if (v1 === v2) return v1;
    // Near enough rather than exactly the same: two positions arrived at by different
    // arithmetic rarely come out equal to the last bit, and the vertex kept is the
    // one whose position both of them take.
    if (Math.hypot(v1.x - v2.x, v1.y - v2.y) >= EPSILON) {
      throw new Error("mergeVertices: Vertices are not at the same position");
    }
    // Reassign all incident edges of v2 to v1
    v2.edges.forEach((edge) => {
      if (edge.tail === v2) edge.tail = v1;
      if (edge.head === v2) {
        if (edge.twin) edge.twin.tail = v1;
      }
      v1.edges.push(edge);
    });
    // Remove duplicate edges (same tail and head)
    v1.edges = v1.edges.filter(
      (edge, idx, arr) =>
        idx ===
        arr.findIndex(
          (e) =>
            e.tail === edge.tail && e.head === edge.head && e !== edge.twin,
        ),
    );
    this.removeVertex(v2);
    return v1;
  }
}

export default Dcel;
