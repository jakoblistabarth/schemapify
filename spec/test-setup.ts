import fs from "fs";
import Point from "../src/lib/geometry/Point";
import Vertex from "../src/lib/dcel/Vertex";
import HalfEdge from "../src/lib/dcel/HalfEdge";
import Face from "../src/lib/DCEL/Face";
import Dcel from "../src/lib/dcel/Dcel";
import config from "../src/schematization.config";
import { crawlArray } from "../src/lib/utilities";

export function getTestFiles(dir: string) {
  const filesInDir = fs.readdirSync(dir);
  return filesInDir.filter((f) => f.substr(-5, f.length) === ".json");
}

type Directions = {
  [key: string]: HalfEdge;
};

export type TestSetup = {
  directions: Directions;
  dcel: Dcel;
  o: Vertex;
};

export function createEdgeVertexSetup() {
  const dcel = new Dcel();
  dcel.config = config;
  const o = new Vertex(0, 0, dcel);
  o.significant = true;

  const destinations: { [key: string]: Vertex } = {
    d0: new Vertex(4, 0, dcel),
    d14: new Vertex(4, 1, dcel),
    d37: new Vertex(4, 3, dcel),
    d53: new Vertex(3, 4, dcel),
    d76: new Vertex(1, 4, dcel),
    d90: new Vertex(0, 4, dcel),
    d104: new Vertex(-1, 4, dcel),
    d143: new Vertex(-4, 3, dcel),
    d153: new Vertex(-4, 2, dcel),
    d166: new Vertex(-4, 1, dcel),
    d180: new Vertex(-4, 0, dcel),
    d217: new Vertex(-4, -3, dcel),
    d243: new Vertex(-2, -4, dcel),
    d270: new Vertex(0, -4, dcel),
    d284: new Vertex(1, -4, dcel),
    d315: new Vertex(4, -4, dcel),
    d333: new Vertex(4, -2, dcel),
  };

  let directions: Directions = {};

  Object.entries(destinations).forEach(([key, vertex]) => {
    const edge = new HalfEdge(o, dcel);
    edge.twin = new HalfEdge(vertex, dcel);
    edge.twin.twin = edge;
    edge.dcel = dcel;
    edge.twin.dcel = dcel;
    directions["o" + key] = edge;
  });

  const setup: TestSetup = { dcel, o, directions };
  return setup;
}

export type ConfigurationSetup = {
  vertices: Vertex[];
  edges: HalfEdge[];
  innerEdge: HalfEdge;
};

export function createConfigurationSetup(
  pointA: Point,
  pointB: Point,
  pointC: Point,
  pointD: Point,
  pointO: Point
): ConfigurationSetup {
  const dcel = new Dcel();
  const points = [pointA, pointB, pointC, pointD, pointO];
  const vertices = points.map((point) => new Vertex(point.x, point.y, dcel));
  const innerFace = new Face();
  const outerFace = new Face();

  const edges = vertices.map((vertex, idx) => {
    const edge = new HalfEdge(vertex, dcel);
    edge.twin = new HalfEdge(crawlArray(vertices, idx, +1), dcel);
    edge.twin.twin = edge;
    edge.face = outerFace;
    edge.twin.face = innerFace;
    return edge;
  });

  edges.forEach((edge, idx) => {
    edge.prev = crawlArray(edges, idx, -1);
    edge.next = crawlArray(edges, idx, +1);
    edge.twin.prev = crawlArray(edges, idx, -1).twin;
    edge.twin.next = crawlArray(edges, idx, +1).twin;
  });

  vertices.forEach((vertex, idx) => {
    vertex.edges.push(edges[idx], edges[idx].prev.twin);
  });

  const configuration: ConfigurationSetup = {
    vertices: vertices,
    edges: edges,
    innerEdge: edges[1],
  };
  return configuration;
}
