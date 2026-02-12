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
  const origin = dcel.addVertex(0, 0);

  const destinations: { [key: string]: Vertex } = {
    d0: dcel.addVertex(4, 0),
    d14: dcel.addVertex(4, 1),
    d37: dcel.addVertex(4, 3),
    d53: dcel.addVertex(3, 4),
    d76: dcel.addVertex(1, 4),
    d90: dcel.addVertex(0, 4),
    d104: dcel.addVertex(-1, 4),
    d143: dcel.addVertex(-4, 3),
    d153: dcel.addVertex(-4, 2),
    d166: dcel.addVertex(-4, 1),
    d180: dcel.addVertex(-4, 0),
    d217: dcel.addVertex(-4, -3),
    d243: dcel.addVertex(-2, -4),
    d270: dcel.addVertex(0, -4),
    d284: dcel.addVertex(1, -4),
    d315: dcel.addVertex(4, -4),
    d333: dcel.addVertex(4, -2),
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
  // Register provided HalfEdge fixtures directly into the DCEL to preserve
  // object identity and ordering expected by tests (pre-migration behavior).
  edges.forEach((direction) => {
    const tail = origin;
    const head = dcel.addVertex(direction.head?.x ?? 0, direction.head?.y ?? 0);

    // create canonical half-edges if not already registered
    const key = HalfEdge.getKey(tail, head);
    let halfEdge = dcel.halfEdges.get(key);
    if (!halfEdge) {
      // use the provided fixture object if its dcel matches
      halfEdge = direction;
      if (halfEdge.id === undefined) halfEdge.id = dcel.nextHalfEdgeId++;
      dcel.halfEdges.set(key, halfEdge);
      // ensure it's in the tail's incident edges
      if (tail.edges.indexOf(halfEdge) === -1) tail.edges.push(halfEdge);
    }

    const twinKey = HalfEdge.getKey(head, tail);
    let halfEdgeTwin = dcel.halfEdges.get(twinKey);
    if (!halfEdgeTwin) {
      halfEdgeTwin = halfEdge.twin ?? new HalfEdge(head, dcel);
      if (halfEdgeTwin.id === undefined)
        halfEdgeTwin.id = dcel.nextHalfEdgeId++;
      dcel.halfEdges.set(twinKey, halfEdgeTwin);
      if (head.edges.indexOf(halfEdgeTwin) === -1)
        head.edges.push(halfEdgeTwin);
    }

    halfEdge.twin = halfEdgeTwin;
    halfEdgeTwin.twin = halfEdge;
    // sort incident edges so angle-based ordering is consistent
    tail.sortEdges();
    head.sortEdges();
  });
};

export const createStaircaseSetup = (
  destination: Position,
  assignedDirection: number,
  orientation: Orientation,
  options: { style?: CStyle; significantVertices?: number[] } = {},
) => {
  const { style = cStyle, significantVertices = [] } = options;
  const dcel = new Dcel();
  const o = dcel.addVertex(0, 0);
  const d = dcel.addVertex(destination[0], destination[1]);
  const edge = dcel.addHalfEdge(o, d);
  const twin = dcel.addHalfEdge(d, o);
  edge.twin = twin;
  twin.twin = edge;
  o.edges.push(edge);
  const key = edge.id ?? -1;
  const generator = new StaircaseGenerator(
    significantVertices,
    new Map([[key, { orientation, assignedDirection }]]),
    style,
  );
  const staircases = generator.run(dcel);
  return key !== -1 ? staircases.get(key) : undefined;
};

type Options = {
  c?: CRegular | CIrregular;
  significantVertices?: number[];
};

export const getClassification = (
  testSetup: TestSetup,
  edges: HalfEdge[],
  classficationProperty: "orientation" | "assignedDirection",
  options: Options = {},
) => {
  const { dcel, origin } = testSetup;
  const { c = cStyle.c, significantVertices = [] } = options;
  // register only the provided subset of fixture directions for this test
  createDcel(origin, edges);
  const assignedDirections = new HalfEdgeClassGenerator(
    c,
    significantVertices,
  ).run(dcel);
  const directionSolution = origin.edges.map(
    (edge) => assignedDirections.get(edge.id ?? -1)?.[classficationProperty],
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
  const vertices = points.map((point) => dcel.addVertex(point.x, point.y));
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
    // ensure half-edges have numeric ids and are registered in the dcel
    if (edge.id === undefined) edge.id = dcel.nextHalfEdgeId++;
    if (edge.twin.id === undefined) edge.twin.id = dcel.nextHalfEdgeId++;
    dcel.halfEdges.set(HalfEdge.getKey(edge.tail, edge.head!), edge);
    dcel.halfEdges.set(
      HalfEdge.getKey(edge.twin!.tail, edge.twin!.head!),
      edge.twin!,
    );
  });

  vertices.forEach((vertex, idx) => {
    const edge = edges[idx];
    if (edge.prev?.twin) vertex.edges.push(edge, edge.prev.twin);
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
