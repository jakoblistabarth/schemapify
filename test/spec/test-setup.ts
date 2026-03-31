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
import HalfEdge from "@/src/Dcel/HalfEdge";
import Vertex from "@/src/Dcel/Vertex";
import Point from "@/src/geometry/Point";
import { crawlArray } from "@/src/utilities";
import fs from "fs";
import { Position } from "geojson";

export function getTestFiles(dir: string, onlyGeoJSON = false) {
  const filesInDir = fs.readdirSync(dir);
  return filesInDir.filter(
    (f) =>
      f.match(/.json$/) && (!f.match(/.subdivision.json$/) || !onlyGeoJSON),
  );
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
    const edge = dcel.addHalfEdge(origin, vertex);
    const twin = dcel.addHalfEdge(vertex, origin);
    edge.twin = twin;
    twin.twin = edge;
    directions["o" + key] = edge;
  });
  // Workaround to make current test setup work:
  // Clear any auto-registered outgoing edges on origin
  // so tests can control `origin.edges` ordering
  origin.edges = [];
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
    const halfEdge = direction;
    halfEdge.tail = tail;
    if (halfEdge.twin) {
      // Register twin using DCEL factories to ensure ids and head/tail linkage
      const twin = dcel.addHalfEdge(head, tail);
      halfEdge.twin = twin;
      twin.twin = halfEdge;
    }
    dcel.registerHalfEdge(halfEdge);
  });

  // Ensure origin.edges contains only the provided subset in the given order
  origin.edges = edges.map((direction) => {
    const head = direction.head ?? direction.twin?.tail;
    if (!head) return direction;
    const key = HalfEdge.getKey(origin, head);
    return dcel.halfEdges.get(key) ?? direction;
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
  const coordKey = edge.coordKey;
  const mapping =
    coordKey !== undefined
      ? new Map<
          string,
          { orientation: Orientation; assignedDirection: number }
        >([[coordKey, { orientation, assignedDirection }]])
      : new Map<
          string,
          { orientation: Orientation; assignedDirection: number }
        >();
  const generator = new StaircaseGenerator(significantVertices, mapping, style);
  const staircases = generator.run(dcel);
  const key = edge.id;
  return typeof key === "number" ? staircases.get(key) : undefined;
};

export const idOr = (v?: { id?: number } | undefined) =>
  typeof v?.id === "number" ? v.id : -1;

/**
 * Extract coordKey from a HalfEdge for stable configuration lookups.
 * @param edge HalfEdge to extract coordKey from
 * @returns coordKey if available, empty string otherwise
 */
export const coordKeyOr = (edge?: { coordKey?: string } | undefined) =>
  edge?.coordKey ?? "";

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
  // Register only the provided subset of fixture directions for this test
  createDcel(origin, edges);
  const assignedDirections = new HalfEdgeClassGenerator(
    c,
    significantVertices,
  ).run(dcel);
  const directionSolution = origin.edges.map(
    (edge) =>
      assignedDirections.get(edge.coordKey ?? "")?.[classficationProperty],
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
  const innerFace = dcel.addFace();
  const outerFace = dcel.addFace();

  const edges = vertices.map((vertex, idx) => {
    const head = crawlArray(vertices, idx, +1);
    const edge = dcel.addHalfEdge(vertex, head);
    const twin = dcel.addHalfEdge(head, vertex);
    edge.twin = twin;
    twin.twin = edge;
    edge.face = outerFace;
    twin.face = innerFace;
    return edge;
  });

  edges.forEach((edge, idx) => {
    edge.prev = crawlArray(edges, idx, -1);
    edge.next = crawlArray(edges, idx, +1);
    if (!edge.twin) return;
    edge.twin.prev = crawlArray(edges, idx, -1).twin;
    edge.twin.next = crawlArray(edges, idx, +1).twin;
  });

  // Register faces with the DCEL so ids are consistent
  dcel.registerFace(innerFace);
  dcel.registerFace(outerFace);

  // Ensure face.edge pointers so faces are considered bounded
  if (edges[0]) {
    outerFace.edge = edges[0];
    if (edges[0].twin) innerFace.edge = edges[0].twin;
  }

  // Ensure halfedges are registered in the DCEL maps (safe-guard)
  edges.forEach((edge) => {
    if (edge.twin) dcel.registerHalfEdge(edge.twin);
    dcel.registerHalfEdge(edge);
  });

  // Rebuild incident edge lists per vertex from the DCEL to ensure correctness
  vertices.forEach((v) => {
    // Collect only half-edges for which this vertex is the tail (outgoing edges)
    const incident = dcel.getHalfEdges().filter((e) => e.tail === v);
    // unique
    v.edges = incident.filter((e, i) => incident.indexOf(e) === i);
    v.sortEdges();
  });

  vertices.forEach((vertex, idx) => {
    const edge = edges[idx];
    if (edge.prev?.twin) {
      if (vertex.edges.indexOf(edge) === -1) vertex.edges.push(edge);
      if (vertex.edges.indexOf(edge.prev.twin) === -1)
        vertex.edges.push(edge.prev.twin);
    }
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
