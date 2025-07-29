import CIrregular from "@/src/c-oriented-schematization/CIrregular";
import CRegular from "@/src/c-oriented-schematization/CRegular";
import HalfEdgeClassGenerator, {
  Orientation,
} from "@/src/c-oriented-schematization/HalfEdgeClassGenerator";
import cStyle, {
  CStyle,
} from "@/src/c-oriented-schematization/schematization.style";
import StaircaseGenerator from "@/src/c-oriented-schematization/StaircaseGenerator";
import Dcel from "@/src/Dcel/Dcel";
import Face from "@/src/Dcel/Face";
import HalfEdge from "@/src/Dcel/HalfEdge";
import Vertex from "@/src/Dcel/Vertex";
import Point from "@/src/geometry/Point";
import { crawlArray } from "@/src/utilities";
import fs from "fs";
import { Position } from "geojson";

export function getTestFiles(dir: string) {
  const filesInDir = fs.readdirSync(dir);
  return filesInDir.filter((f) => f.match(/.json$/));
}

type Directions = {
  [key: string]: HalfEdge;
};

export type TestSetup = {
  directions: Directions;
  dcel: Dcel;
  origin: Vertex;
};

export const createEdgeVertexSetup = () => {
  const dcel = new Dcel();
  const origin = new Vertex(0, 0, dcel);
  dcel.addVertex(origin.x, origin.y);

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

  const directions: Directions = {};

  Object.entries(destinations).forEach(([key, vertex]) => {
    const edge = new HalfEdge(origin, dcel);
    edge.twin = new HalfEdge(vertex, dcel);
    edge.twin.twin = edge;
    directions["o" + key] = edge;
  });

  const setup: TestSetup = { dcel, origin, directions };
  return setup;
};

const createDcel = (origin: Vertex, edges: HalfEdge[]) => {
  const dcel = edges[0].dcel;
  edges.forEach((direction) => {
    const head = new Vertex(
      direction.head?.x ?? 0,
      direction.head?.y ?? 0,
      dcel,
    );
    const tail = origin;
    dcel.addVertex(head.x, head.y);
    const halfEdge = dcel.addHalfEdge(tail, head);
    const halfEdgeTwin = dcel.addHalfEdge(head, tail);
    halfEdge.twin = halfEdgeTwin;
    halfEdgeTwin.twin = halfEdge;
  });
};

export const createStaircaseSetup = (
  destination: Position,
  assignedDirection: number,
  orientation: Orientation,
  options: { style?: CStyle; significantVertices?: string[] } = {},
) => {
  const { style = cStyle, significantVertices = [] } = options;
  const dcel = new Dcel();
  const o = new Vertex(0, 0, dcel);
  const d = new Vertex(destination[0], destination[1], dcel);
  const edge = dcel.addHalfEdge(o, d);
  const twin = dcel.addHalfEdge(d, o);
  edge.twin = twin;
  twin.twin = edge;
  o.edges.push(edge);
  const generator = new StaircaseGenerator(
    significantVertices,
    new Map([[edge.uuid, { orientation, assignedDirection }]]),
    style,
  );
  const staircases = generator.run(dcel);
  return staircases.get(edge.uuid);
};

type Options = {
  c?: CRegular | CIrregular;
  significantVertices?: string[];
};

export const getClassification = (
  testSetup: TestSetup,
  edges: HalfEdge[],
  classficationProperty: "orientation" | "assignedDirection",
  options: Options = {},
) => {
  const { dcel, origin } = testSetup;
  const { c = cStyle.c, significantVertices = [] } = options;
  createDcel(origin, edges);
  const assignedDirections = new HalfEdgeClassGenerator(
    c,
    significantVertices,
  ).run(dcel);
  const directionSolution = origin.edges.map(
    (edge) => assignedDirections.get(edge.uuid)?.[classficationProperty],
  );
  return directionSolution;
};

export type ConfigurationSetup = {
  dcel: Dcel;
  vertices: Vertex[];
  edges: HalfEdge[];
  innerEdge: HalfEdge;
};

export function createConfigurationSetup(
  pointA: Point,
  pointB: Point,
  pointC: Point,
  pointD: Point,
  otherPoints: Point[],
): ConfigurationSetup {
  const dcel = new Dcel();
  const points = [pointA, pointB, pointC, pointD, ...otherPoints];
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
    if (!edge.twin) return;
    edge.twin.prev = crawlArray(edges, idx, -1).twin;
    edge.twin.next = crawlArray(edges, idx, +1).twin;
    dcel.halfEdges.set(edge.uuid, edge);
  });

  vertices.forEach((vertex, idx) => {
    const edge = edges[idx];
    if (edge.prev?.twin) vertex.edges.push(edge, edge.prev.twin);
    dcel.vertices.set(vertex.uuid, vertex);
  });

  const configuration: ConfigurationSetup = {
    dcel,
    vertices,
    edges,
    innerEdge: edges[1],
  };
  return configuration;
}

export const configurationCases = {
  negConvex: createConfigurationSetup(
    new Point(-4, 2),
    new Point(-2, 0),
    new Point(2, 0),
    new Point(4, 2),
    [new Point(0, 6)],
  ),
  posReflex: createConfigurationSetup(
    new Point(-4, 0),
    new Point(-2, 2),
    new Point(2, 2),
    new Point(4, 0),
    [new Point(0, 6)],
  ),
  bothNoBlockingPoint: createConfigurationSetup(
    new Point(-4, 4),
    new Point(-2, 0),
    new Point(2, 0),
    new Point(1, -2),
    [new Point(8, 6)],
  ),
  bothBlockingPointNeg: createConfigurationSetup(
    new Point(-4, 4),
    new Point(-2, 0),
    new Point(2, 0),
    new Point(1, -2),
    [new Point(6, 2)],
  ),
  negConvexParallelTracks: createConfigurationSetup(
    new Point(-2, 2),
    new Point(-2, 0),
    new Point(2, 0),
    new Point(2, 2),
    [new Point(0, 4)],
  ),
  bothParallelTracks: createConfigurationSetup(
    new Point(-2, 2),
    new Point(-2, 0),
    new Point(2, 0),
    new Point(2, -2),
    [new Point(6, 4)],
  ),
  bothContractionOnFirstEdge: createConfigurationSetup(
    new Point(-2, 2),
    new Point(-2, 0),
    new Point(2, 0),
    new Point(8, -2),
    [new Point(4, 4)],
  ),
  bothContractionOnThirdEdge: createConfigurationSetup(
    new Point(-8, -2),
    new Point(-2, 0),
    new Point(2, 0),
    new Point(2, 2),
    [new Point(-4, 4)],
  ),
};
