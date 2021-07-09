import fs from "fs";
import DcelC from "src/lib/DCELC/DcelC";
import HalfEdgeC from "src/lib/DCELC/HalfEdgeC";
import VertexC from "src/lib/DCELC/VertexC";
import HalfEdge from "../src/lib/dcel/HalfEdge";
import config from "../src/schematization.config";

export function getTestFiles(dir: string) {
  const filesInDir = fs.readdirSync(dir);
  return filesInDir.filter((f) => f.substr(-5, f.length) === ".json");
}

type Directions = {
  [key: string]: HalfEdge;
};

export type TestSetup = {
  directions: Directions;
  dcel: DcelC;
  o: VertexC;
};

export function createEdgeVertexSetup() {
  const dcel = new DcelC();
  dcel.config = config;
  const o = new VertexC(0, 0, dcel);
  o.significant = true;

  const destinations: { [key: string]: VertexC } = {
    d0: new VertexC(4, 0, dcel),
    d14: new VertexC(4, 1, dcel),
    d37: new VertexC(4, 3, dcel),
    d53: new VertexC(3, 4, dcel),
    d76: new VertexC(1, 4, dcel),
    d90: new VertexC(0, 4, dcel),
    d104: new VertexC(-1, 4, dcel),
    d143: new VertexC(-4, 3, dcel),
    d153: new VertexC(-4, 2, dcel),
    d166: new VertexC(-4, 1, dcel),
    d180: new VertexC(-4, 0, dcel),
    d217: new VertexC(-4, -3, dcel),
    d243: new VertexC(-2, -4, dcel),
    d270: new VertexC(0, -4, dcel),
    d284: new VertexC(1, -4, dcel),
    d315: new VertexC(4, -4, dcel),
    d333: new VertexC(4, -2, dcel),
  };

  let directions: Directions = {};

  Object.entries(destinations).forEach(([key, vertex]) => {
    const edge = new HalfEdgeC(o, dcel);
    edge.twin = new HalfEdgeC(vertex, dcel);
    edge.twin.twin = edge;
    edge.dcel = dcel;
    edge.twin.dcel = dcel;
    directions["o" + key] = edge;
  });

  const setup: TestSetup = { dcel, o, directions };
  return setup;
}
