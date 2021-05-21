import config from "../../schematization.config.mjs";
import Vertex from "./Vertex.mjs";
import HalfEdge from "./HalfEdge.mjs";
import Face from "./Face.mjs";

class Dcel {
  constructor() {
    this.vertices = {};
    this.halfEdges = [];
    this.faces = [];
    this.featureProperties = null;
  }

  makeVertex(lng, lat) {
    const key = Vertex.getKey(lng, lat); // TODO: is there a better way to ensure that a coordinate pair vertex is added only once to the vertex list
    if (this.vertices[key]) return this.vertices[key];

    const vertex = new Vertex(lng, lat, this);
    this.vertices[key] = vertex;
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
    return this.faces.find((f) => f.edge == null);
  }

  // as seen @ https://github.com/Turfjs/turf/blob/master/packages/turf-bbox/index.ts
  // takes a dcel
  // returns its Boundingbox as [minX, minY, maxX, maxY]
  getBbox() {
    const points = Object.values(this.vertices).map((p) => [p.x, p.y]);
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
    // TODO: refactor this?
    const [a, b, c, d] = [
      new Vertex(bbox[0], bbox[1]),
      new Vertex(bbox[2], bbox[1]),
      new Vertex(bbox[2], bbox[3]),
      new Vertex(bbox[0], bbox[3]),
    ];

    return Math.max(
      ...[
        // TODO: refactor this – only two sides necessary?
        a.getDistance(b),
        b.getDistance(c),
        c.getDistance(d),
        d.getDistance(a),
      ]
    );
  }

  findVertex(lng, lat) {
    const key = Vertex.getKey(lng, lat);
    return this.vertices[key];
  }

  removeHalfEdge(edge) {
    const idx = this.halfEdges.indexOf(edge);
    if (idx > -1) {
      this.halfEdges.splice(idx, 1);
    }
    return this.halfEdges;
  }

  static buildFromGeoJSON(geoJSON) {
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
    Object.values(subdivision.vertices).forEach((vertex) => {
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

    subdivision.setEpsilon(config.eFactor);
    return subdivision;
  }

  // get epsilon
  // – the threshold for max edge length
  // takes a dcel
  // returns the treshold as float
  setEpsilon(factor) {
    this.epsilon = this.getDiameter() * factor;
  }
}

export default Dcel;
