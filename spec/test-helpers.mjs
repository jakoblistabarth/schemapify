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
  const d37 = new Vertex(4, 3);
  const d53 = new Vertex(3, 4);
  const d76 = new Vertex(1, 4);
  const d90 = new Vertex(0, 4);
  const d104 = new Vertex(-1, 4);
  const d143 = new Vertex(-4, 3);
  const d180 = new Vertex(-4, 0);
  const d217 = new Vertex(-4, -3);
  const d270 = new Vertex(0, -4);
  const d284 = new Vertex(1, -4);
  const d315 = new Vertex(4, -4);
  const d333 = new Vertex(4, -2);

  const od0 = new HalfEdge(setup.o);
  od0.twin = new HalfEdge(d0);
  od0.twin.twin = od0;
  setup.od0 = od0;

  const od37 = new HalfEdge(setup.o);
  od37.twin = new HalfEdge(d37);
  od37.twin.twin = od37;
  setup.od37 = od37;

  const od53 = new HalfEdge(setup.o);
  od53.twin = new HalfEdge(d53);
  od53.twin.twin = od53;
  setup.od53 = od53;

  const od76 = new HalfEdge(setup.o);
  od76.twin = new HalfEdge(d76);
  od76.twin.twin = od76;
  setup.od76 = od76;

  const od90 = new HalfEdge(setup.o);
  od90.twin = new HalfEdge(d90);
  od90.twin.twin = od90;
  setup.od90 = od90;

  const od104 = new HalfEdge(setup.o);
  od104.twin = new HalfEdge(d104);
  od104.twin.twin = od104;
  setup.od104 = od104;

  const od143 = new HalfEdge(setup.o);
  od143.twin = new HalfEdge(d143);
  od143.twin.twin = od143;
  setup.od143 = od143;

  const od180 = new HalfEdge(setup.o);
  od180.twin = new HalfEdge(d180);
  od180.twin.twin = od180;
  setup.od180 = od180;

  const od217 = new HalfEdge(setup.o);
  od217.twin = new HalfEdge(d217);
  od217.twin.twin = od217;
  setup.od217 = od217;

  const od270 = new HalfEdge(setup.o);
  od270.twin = new HalfEdge(d270);
  od270.twin.twin = od270;
  setup.od270 = od270;

  const od284 = new HalfEdge(setup.o);
  od284.twin = new HalfEdge(d284);
  od284.twin.twin = od284;
  setup.od284 = od284;

  const od315 = new HalfEdge(setup.o);
  od315.twin = new HalfEdge(d315);
  od315.twin.twin = od315;
  setup.od315 = od315;

  const od333 = new HalfEdge(setup.o);
  od333.twin = new HalfEdge(d333);
  od333.twin.twin = od333;
  setup.od333 = od333;

  setup.c2 = new C(2);
  setup.c4 = new C(4);

  return setup;
}
