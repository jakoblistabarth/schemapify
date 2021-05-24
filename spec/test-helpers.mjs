import { readdirSync } from "fs";
import HalfEdge from "../assets/lib/dcel/HalfEdge.mjs";
import Vertex from "../assets/lib/dcel/Vertex.mjs";
import C from "../assets/lib/orientation-restriction/C.mjs";

export function getTestFiles(dir) {
  const filesInDir = readdirSync(dir, function (err, files) {
    if (err) {
      return console.log("Unable to scan directory: " + err);
    }
    return files;
  });

  return filesInDir.filter((f) => f.substr(-5, f.length) === ".json");
}

export function createEdgeVertexSetup() {
  const setup = {};
  setup.o = new Vertex(0, 0);
  const d0 = new Vertex(4, 0);
  const d14 = new Vertex(4, 1);
  const d90 = new Vertex(0, 4);
  const d104 = new Vertex(-1, 4);
  const d180 = new Vertex(-4, 0);
  const d225 = new Vertex(-4, -4);
  const d270 = new Vertex(0, -4);
  const d284 = new Vertex(1, -4);

  const od0 = new HalfEdge(setup.o);
  od0.twin = new HalfEdge(d0);
  od0.twin.twin = od0;
  setup.od0 = od0;

  const od14 = new HalfEdge(setup.o);
  od14.twin = new HalfEdge(d14);
  od14.twin.twin = od14;
  setup.od14 = od14;

  const od90 = new HalfEdge(setup.o);
  od90.twin = new HalfEdge(d90);
  od90.twin.twin = od90;
  setup.od90 = od90;

  const od104 = new HalfEdge(setup.o);
  od104.twin = new HalfEdge(d104);
  od104.twin.twin = od104;
  setup.od104 = od104;

  const od180 = new HalfEdge(setup.o);
  od180.twin = new HalfEdge(d180);
  od180.twin.twin = od180;
  setup.od180 = od180;

  const od225 = new HalfEdge(setup.o);
  od225.twin = new HalfEdge(d225);
  od225.twin.twin = od225;
  setup.od225 = od225;

  const od270 = new HalfEdge(setup.o);
  od270.twin = new HalfEdge(d270);
  od270.twin.twin = od270;
  setup.od270 = od270;

  const od284 = new HalfEdge(setup.o);
  od284.twin = new HalfEdge(d284);
  od284.twin.twin = od284;
  setup.od284 = od284;

  setup.c2 = new C(2);
  setup.c4 = new C(4);

  return setup;
}
