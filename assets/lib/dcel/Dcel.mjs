import config from "../../schematization.config.mjs";
import Vertex from "./Vertex.mjs";
import HalfEdge from "./HalfEdge.mjs";
import Face from "./Face.mjs";

class Dcel {
  constructor() {
    this.vertices = {};
    this.halfEdges = [];
    this.faces = [];
    // this.outerFace = this.makeFace()
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
      // console.log(edge.tail, edge.twin.tail);
      // console.log(edge.tail);
      return tail == edge.tail && edge.twin.tail == head;
    });
    if (existingHalfEdge) return existingHalfEdge;

    const halfEdge = new HalfEdge(tail, this);
    this.halfEdges.push(halfEdge);
    tail.edges.push(halfEdge);
    return halfEdge;
  }

  makeFace(properties) {
    const face = new Face();
    face.properties = properties ? properties : {}; //TODO: move this into the constructor?
    this.faces.push(face);
    return face;
  }

  getFaces() {
    return this.faces;
  }

  getInnerFaces() {
    return this.faces.filter((f) => f.properties.type !== "outerFace");
  }

  // as seen @ https://github.com/Turfjs/turf/blob/master/packages/turf-bbox/index.ts
  // takes a dcel
  // returns its Boundingbox as [minX, minY, maxX, maxY]
  getBbox() {
    const points = Object.values(this.vertices).map((p) => [p.lng, p.lat]);
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
      polygon.forEach((ring) => {
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
    geoJSON.features.forEach((feature) => {
      const multiPolygons =
        feature.geometry.type !== "MultiPolygon"
          ? [feature.geometry.coordinates]
          : feature.geometry.coordinates; // TODO: check in e.g, parseGeoJSON()? if only polygons in Multipolygons

      let leftFace;
      multiPolygons.forEach((polygon) =>
        polygon.forEach((ring, idx) => {
          const [firstPoint, secondPoint] = ring;
          const edge = subdivision.halfEdges.find((e) => {
            return (
              e.tail.lng === firstPoint[0] &&
              e.tail.lat === firstPoint[1] &&
              e.twin.tail.lng === secondPoint[0] &&
              e.twin.tail.lat === secondPoint[1]
            );
          });

          // TODO: set face for twin edges of interior rings
          if (idx == 0) {
            // only for exterior ring
            leftFace = subdivision.makeFace(feature.properties);
            edge.getCycle().forEach((e) => (e.face = leftFace));
            leftFace.edge = edge;
          } else {
            const face = subdivision.makeFace(feature.properties);
            edge.getCycle().forEach((e) => (e.face = face));
            face.edge = edge.twin;
            edge.twin.getCycle().forEach((e) => (e.face = leftFace));
          }
        })
      );
    });

    // create outerface and assign it to edges which do not have a face yet
    subdivision.outerFace = subdivision.makeFace({ type: "outerFace" });
    let outerEdge = subdivision.halfEdges.find((edge) => edge.face === null);
    subdivision.outerFace.edge = outerEdge;
    while (subdivision.halfEdges.find((edge) => edge.face === null)) {
      outerEdge = subdivision.halfEdges.find((edge) => edge.face === null);
      outerEdge.getCycle().forEach((edge) => {
        edge.face = subdivision.outerFace;
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
