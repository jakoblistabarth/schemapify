import * as geojson from "geojson";
import { Config } from "src/schematization.config";
import { DcelInterface, Snapshot } from "../DCEL/Dcel";
import Face from "../DCEL/Face";
import Vertex from "../DCEL/Vertex";
import HalfEdgeC from "./HalfEdgeC";
import VertexC from "./VertexC";

class DcelC implements DcelInterface {
  vertices: Map<string, Vertex>;
  halfEdges: Map<string, HalfEdgeC>;
  faces: Array<Face>;
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
   * @returns The created {@link HalfEdgeC}.
   */
  makeHalfEdge(tail: VertexC, head: VertexC): HalfEdgeC {
    const key = HalfEdgeC.getKey(tail, head);
    if (this.halfEdges.has(key)) return this.halfEdges.get(key);

    const halfEdge = new HalfEdgeC(tail, this);
    this.halfEdges.set(key, halfEdge);
    tail.edges.push(halfEdge);
    tail.edges.sort();
    return halfEdge;
  }
}

export default DcelC;
