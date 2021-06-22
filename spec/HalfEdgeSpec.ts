import fs from "fs";
import path from "path";
import Dcel from "../assets/lib/dcel/Dcel";
import { config } from "../assets/schematization.config";
import HalfEdge from "../assets/lib/dcel/HalfEdge";
import Vertex from "../assets/lib/dcel/Vertex";
import Point from "../assets/lib/Geometry/Point";
import C from "../assets/lib/OrientationRestriction/C";
import { getTestFiles } from "./test-setup";
import { createEdgeVertexSetup, TestSetup } from "./test-setup";

describe("getLength()", function () {
  it("returns the correct length for a single halfEdge", function () {
    const a = new Vertex(0, 0, null);
    const b = new Vertex(2, 0, null);
    const edge = new HalfEdge(a, null);
    edge.twin = new HalfEdge(b, null);
    edge.twin.twin = edge;

    expect(edge.getLength()).toEqual(2);
  });

  it("returns the correct length for all sides of a square", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("assets/data/shapes/square.json"), "utf8")
    );
    const dcel = Dcel.fromGeoJSON(json);

    dcel
      .getBoundedFaces()[0]
      .edge.getCycle()
      .forEach((e) => {
        expect(e.getLength()).toBe(2);
      });
  });

  it("returns the correct length for the sides of a triangle", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("assets/data/shapes/triangle.json"), "utf8")
    );
    const dcel = Dcel.fromGeoJSON(json);

    const lengths = dcel
      .getBoundedFaces()[0]
      .edge.getCycle()
      .map((e) => e.getLength());
    expect(lengths.sort()).toEqual([14.142135623730951, 14.142135623730951, 20]);
  });
});

describe("getMidpoint()", function () {
  it("returns the correct length", function () {
    const a = new Vertex(0, 0, null);
    const b = new Vertex(2, 0, null);
    const edge = new HalfEdge(a, null);
    edge.twin = new HalfEdge(b, null);
    edge.twin.twin = edge;

    const c = new Vertex(0, 10, null);
    const edge2 = new HalfEdge(a, null);
    edge2.twin = new HalfEdge(c, null);
    edge2.twin.twin = edge2;

    expect(edge.getMidpoint()).toEqual(new Point(1, 0));
    expect(edge2.getMidpoint()).toEqual(new Point(0, 5));
  });
});

describe("distanceToEdge()", function () {
  it("returns the minimum distance between 2 edges", function () {
    const a = new Vertex(0, 0, null);
    const b = new Vertex(-10, 10, null);
    const v = new Vertex(-1, -2, null);
    const w = new Vertex(2, 1, null);

    const ab = new HalfEdge(a, null);
    ab.twin = new HalfEdge(b, null);
    ab.twin.twin = ab;

    const vw = new HalfEdge(v, null);
    vw.twin = new HalfEdge(w, null);
    vw.twin.twin = vw;

    expect(ab.distanceToEdge(vw)).toEqual(Math.sqrt(0.5));
    expect(vw.distanceToEdge(ab)).toEqual(Math.sqrt(0.5));
  });
});

describe("getAngle()", function () {
  it("returns the correct angle", function () {
    const center = new Vertex(0, 0, null);

    const headRight = new Vertex(4, 0, null);
    const edgeRight = new HalfEdge(center, null);
    edgeRight.twin = new HalfEdge(headRight, null);
    edgeRight.twin.twin = edgeRight;

    const headBottom = new Vertex(0, -1, null);
    const edgeBottom = new HalfEdge(center, null);
    edgeBottom.twin = new HalfEdge(headBottom, null);
    edgeBottom.twin.twin = edgeBottom;

    const headLeft = new Vertex(-20, 0, null);
    const edgeLeft = new HalfEdge(center, null);
    edgeLeft.twin = new HalfEdge(headLeft, null);
    edgeLeft.twin.twin = edgeLeft;

    const headTop = new Vertex(0, 100, null);
    const edgeTop = new HalfEdge(center, null);
    edgeTop.twin = new HalfEdge(headTop, null);
    edgeTop.twin.twin = edgeTop;

    expect(edgeRight.getAngle()).toBe(0);
    expect(edgeTop.getAngle()).toBe(Math.PI * 0.5);
    expect(edgeLeft.getAngle()).toBe(Math.PI);
    expect(edgeBottom.getAngle()).toBe(Math.PI * 1.5);
  });
});

describe("getAssignedDirection()", function () {
  let s: TestSetup;
  beforeEach(function () {
    s = createEdgeVertexSetup();
  });

  it("returns the correct angle", function () {
    s.dcel.config = { ...config, c: new C(2) };
    s.directions.od53.assignedDirection = 1;
    s.directions.od104.assignedDirection = 2;
    s.directions.od217.assignedDirection = 3;
    s.directions.od315.assignedDirection = 0;

    expect(s.directions.od53.getAssignedAngle()).toBe(s.dcel.config.c.getAngles()[1]);
    expect(s.directions.od104.getAssignedAngle()).toBe(s.dcel.config.c.getAngles()[2]);
    expect(s.directions.od217.getAssignedAngle()).toBe(s.dcel.config.c.getAngles()[3]);
    expect(s.directions.od315.getAssignedAngle()).toBe(s.dcel.config.c.getAngles()[0]);
  });
});

describe("getCycle()", function () {
  it("returns the correct number of edges for square", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("assets/data/shapes/square.json"), "utf8")
    );
    const dcel = Dcel.fromGeoJSON(json);

    expect(dcel.getBoundedFaces()[0].edge.getCycle().length).toBe(4);
    expect(dcel.getBoundedFaces()[0].edge.twin.getCycle().length).toBe(4);
  });

  it("returns the correct number of edges for a triangle", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("assets/data/shapes/triangle.json"), "utf8")
    );
    const dcel = Dcel.fromGeoJSON(json);

    expect(dcel.getBoundedFaces()[0].edge.getCycle().length).toBe(3);
    expect(dcel.getBoundedFaces()[0].edge.twin.getCycle().length).toBe(3);
  });
});

describe("bisect() on geodata results in a Dcel", function () {
  const dir = "assets/data/geodata";
  const testFiles = getTestFiles(dir);

  testFiles.forEach((file) => {
    it(
      "with complete cycles for all faces in counter-clockwise and clockwise direction of file " +
        file,
      function () {
        const json = JSON.parse(fs.readFileSync(path.resolve(dir + "/" + file), "utf8"));
        const dcel = Dcel.fromGeoJSON(json);
        dcel.preProcess();

        const cycles: HalfEdge[][] = [];
        dcel.getBoundedFaces().forEach((f) => {
          cycles.push(f.getEdges());
          cycles.push(f.getEdges(false));
        });

        expect(cycles.length).toBeGreaterThanOrEqual(1);
      }
    );
  });
});

describe("bisect() on simple shapes results in a Dcel", function () {
  const dir = "assets/data/shapes";
  const testFiles = getTestFiles(dir);

  testFiles.forEach((file) => {
    it(
      "with complete cycles for all faces in counter-clockwise and clockwise direction of file " +
        file,
      function () {
        const json = JSON.parse(fs.readFileSync(path.resolve(dir + "/" + file), "utf8"));
        const dcel = Dcel.fromGeoJSON(json);
        dcel.getBoundedFaces().forEach((f) => f.getEdges().forEach((e) => e.bisect()));

        const cycles: HalfEdge[][] = [];
        dcel.getBoundedFaces().forEach((f) => {
          cycles.push(f.getEdges());
          cycles.push(f.getEdges(false));
        });

        expect(cycles.length).toBeGreaterThanOrEqual(1);
      }
    );
  });
});

describe("bisect()", function () {
  it("on one edge of a triangle results in 4 linked halfEdges", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("assets/data/shapes/triangle.json"), "utf8")
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel.getBoundedFaces()[0].getEdges()[0].bisect();

    expect(dcel.getBoundedFaces()[0].getEdges().length).toBe(4);
    expect(dcel.getBoundedFaces()[0].getEdges(false).length).toBe(4);
    expect(dcel.getBoundedFaces()[0].edge.twin.getCycle().length).toBe(4);
    expect(dcel.getBoundedFaces()[0].edge.twin.getCycle(false).length).toBe(4);
  });

  it("on one edge of a square results in 5 linked outer halfEdges", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("assets/data/shapes/square.json"), "utf8")
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel.getBoundedFaces()[0].getEdges()[0].bisect();

    expect(dcel.getBoundedFaces()[0].edge.twin.getCycle().length).toBe(5);
    expect(dcel.getBoundedFaces()[0].edge.twin.getCycle(false).length).toBe(5);
  });

  it("on one outer edge of a square results in 5 linked inner halfEdges", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("assets/data/shapes/square.json"), "utf8")
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel.getBoundedFaces()[0].edge.twin.bisect();

    expect(dcel.getFaces().length).toBe(2);
    expect(dcel.halfEdges.size).toBe(10);

    expect(dcel.getBoundedFaces()[0].getEdges().length).toBe(5);
    expect(dcel.getBoundedFaces()[0].getEdges(false).length).toBe(5);
  });

  it("on one inneredge of a square results in 5 linked outer halfEdges", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("assets/data/shapes/square.json"), "utf8")
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel.getBoundedFaces()[0].edge.bisect();

    expect(dcel.getFaces().length).toBe(2);
    expect(dcel.halfEdges.size).toBe(10);

    expect(dcel.getBoundedFaces()[0].edge.twin.getCycle().length).toBe(5);
    expect(dcel.getBoundedFaces()[0].edge.twin.getCycle(false).length).toBe(5);
  });

  it("on a square with a specified point, which is not on the origina edge, restults in a correct dcel", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("assets/data/shapes/square.json"), "utf8")
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel.getBoundedFaces()[0].edge.bisect(new Point(1, 1));

    expect(dcel.getFaces().length).toBe(2);
    expect(dcel.halfEdges.size).toBe(10);

    expect(dcel.getBoundedFaces()[0].edge.twin.getCycle().length).toBe(5);
    expect(dcel.getBoundedFaces()[0].edge.twin.getCycle(false).length).toBe(5);
  });

  it("on the 1st outer edge of the first of 2 adjacent triangles results in 4 and 3 linked inner and 5 linked outer halfEdges", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("assets/data/shapes/2triangle-adjacent.json"), "utf8")
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel.getBoundedFaces()[0].getEdges()[1].bisect();

    expect(dcel.getFaces().length).toBe(3);
    expect(dcel.halfEdges.size).toBe(12);

    expect(dcel.getBoundedFaces()[0].getEdges().length).toBe(4);
    expect(dcel.getBoundedFaces()[0].getEdges(false).length).toBe(4);
    expect(dcel.getBoundedFaces()[1].getEdges().length).toBe(3);
    expect(dcel.getBoundedFaces()[1].getEdges(false).length).toBe(3);
    expect(dcel.getBoundedFaces()[0].edge.twin.getCycle().length).toBe(5);
    expect(dcel.getBoundedFaces()[0].edge.twin.getCycle(false).length).toBe(5);
  });

  it("on the 2nd outer edge of the first of 2 adjacent triangles results in 4 and 3 linked inner and 5 linked outer halfEdges", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("assets/data/shapes/2triangle-adjacent.json"), "utf8")
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel.getBoundedFaces()[0].getEdges()[2].bisect();

    expect(dcel.getFaces().length).toBe(3);
    expect(dcel.halfEdges.size).toBe(12);

    expect(dcel.getBoundedFaces()[0].getEdges().length).toBe(4);
    expect(dcel.getBoundedFaces()[0].getEdges(false).length).toBe(4);
    expect(dcel.getBoundedFaces()[1].getEdges().length).toBe(3);
    expect(dcel.getBoundedFaces()[1].getEdges(false).length).toBe(3);
    expect(dcel.getBoundedFaces()[0].edge.twin.getCycle().length).toBe(5);
    expect(dcel.getBoundedFaces()[0].edge.twin.getCycle(false).length).toBe(5);
  });
});

describe("subdivideToThreshold()", function () {
  it("on one egde of a square with side length 2 into 8 edges (epsilon: .5)", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("assets/data/shapes/square.json"), "utf8")
    );
    const dcel = Dcel.fromGeoJSON(json);
    const edge = dcel.getBoundedFaces()[0].edge;

    const halfEdgesBefore = dcel.halfEdges.size;
    edge.subdivideToThreshold(0.5);
    const halfEdgesAfter = dcel.halfEdges.size;

    expect(halfEdgesAfter).toBe(halfEdgesBefore - 2 + 8 * 2);
  });

  it("turns an square with sides of length 2 into a dcel with 64 edges (epsilon: .5)", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("assets/data/shapes/square.json"), "utf8")
    );
    const dcel = Dcel.fromGeoJSON(json);

    dcel.splitEdges(0.5);

    expect(dcel.halfEdges.size).toBe(64);
  });
});
