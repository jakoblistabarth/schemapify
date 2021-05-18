import DCEL from "../assets/lib/dcel/Dcel.mjs";
import HalfEdge from "../assets/lib/dcel/HalfEdge.mjs";
import Vertex from "../assets/lib/dcel/Vertex.mjs";
import { readFileSync } from "fs";
import { resolve } from "path";
import { getTestFiles, checkIfEntitiesComplete } from "./test-helpers.mjs";

describe("getLength()", function () {
  it("returns the correct length", function () {
    const a = new Vertex(0, 0);
    const b = new Vertex(2, 0);
    const edge = new HalfEdge(a);
    edge.twin = new HalfEdge(b);
    edge.twin.twin = edge;

    expect(edge.getLength()).toEqual(2);
  });
});

describe("getMidpoint()", function () {
  it("returns the correct length", function () {
    const a = new Vertex(0, 0);
    const b = new Vertex(2, 0);
    const edge = new HalfEdge(a);
    edge.twin = new HalfEdge(b);
    edge.twin.twin = edge;

    const c = new Vertex(0, 10);
    const edge2 = new HalfEdge(a);
    edge2.twin = new HalfEdge(c);
    edge2.twin.twin = edge2;

    expect(edge.getMidpoint()).toEqual([1, 0]);
    expect(edge2.getMidpoint()).toEqual([0, 5]);
  });
});

describe("getAngle()", function () {
  it("returns the correct angle", function () {
    const center = new Vertex(0, 0);

    const headRight = new Vertex(4, 0);
    const edgeRight = new HalfEdge(center);
    edgeRight.twin = new HalfEdge(headRight);
    edgeRight.twin.twin = edgeRight;

    const headBottom = new Vertex(0, -1);
    const edgeBottom = new HalfEdge(center);
    edgeBottom.twin = new HalfEdge(headBottom);
    edgeBottom.twin.twin = edgeBottom;

    const headLeft = new Vertex(-20, 0);
    const edgeLeft = new HalfEdge(center);
    edgeLeft.twin = new HalfEdge(headLeft);
    edgeLeft.twin.twin = edgeLeft;

    const headTop = new Vertex(0, 100);
    const edgeTop = new HalfEdge(center);
    edgeTop.twin = new HalfEdge(headTop);
    edgeTop.twin.twin = edgeTop;

    expect(edgeRight.getAngle()).toBe(0);
    expect(edgeTop.getAngle()).toBe(Math.PI * 0.5);
    expect(edgeLeft.getAngle()).toBe(Math.PI);
    expect(edgeBottom.getAngle()).toBe(Math.PI * 1.5);
  });
});

describe("getCycle()", function () {
  it("returns the correct number of edges for square", function () {
    const json = JSON.parse(readFileSync(resolve("assets/data/shapes/square.json"), "utf8"));
    const dcel = DCEL.buildFromGeoJSON(json);

    expect(dcel.getInnerFaces()[0].edge.getCycle().length).toBe(4);
    expect(dcel.outerFace.edge.getCycle().length).toBe(4);
  });

  it("returns the correct number of edges for a triangle", function () {
    const json = JSON.parse(readFileSync(resolve("assets/data/shapes/triangle.json"), "utf8"));
    const dcel = DCEL.buildFromGeoJSON(json);

    expect(dcel.getInnerFaces()[0].edge.getCycle().length).toBe(3);
    expect(dcel.outerFace.edge.getCycle().length).toBe(3);
  });
});

describe("bisect() on one edge of a triangle results in a complete DCEL", function () {
  const json = JSON.parse(readFileSync(resolve("assets/data/shapes/triangle.json"), "utf8"));
  const dcel = DCEL.buildFromGeoJSON(json);
  dcel.getInnerFaces()[0].getEdges()[0].bisect();

  checkIfEntitiesComplete(dcel);
});

xdescribe("bisect() on geodata results in a DCEL", function () {
  const dir = "assets/data/geodata";
  const testFiles = getTestFiles(dir);

  testFiles.forEach((file) => {
    const json = JSON.parse(readFileSync(resolve(dir + "/" + file), "utf8"));
    const dcel = DCEL.buildFromGeoJSON(json);
    // dcel.getInnerFaces().forEach((f) => f.getEdges().forEach((e) => e.bisect()));

    checkIfEntitiesComplete(dcel);

    xit("with complete cycles for all faces in counter-clockwise and clockwise direction", function () {
      const cycles = [];
      dcel.getFaces().forEach((f) => {
        cycles.push(f.getEdges());
        cycles.push(f.getEdges(false));
      });

      expect(cycles).nothing();
    });
  });
});

describe("bisect() on simple shapes results in a DCEL", function () {
  const dir = "assets/data/shapes";
  const testFiles = getTestFiles(dir);

  testFiles.forEach((file) => {
    const json = JSON.parse(readFileSync(resolve(dir + "/" + file), "utf8"));
    const dcel = DCEL.buildFromGeoJSON(json);
    dcel.getInnerFaces().forEach((f) => f.getEdges().forEach((e) => e.bisect()));

    checkIfEntitiesComplete(dcel);

    it("with complete cycles for all faces in counter-clockwise and clockwise direction", function () {
      const cycles = [];
      dcel.getFaces().forEach((f) => {
        cycles.push(f.getEdges());
        cycles.push(f.getEdges(false));
      });

      expect(cycles).nothing();
    });
  });
});

describe("bisect()", function () {
  it("on one edge of a triangle results in 4 linked halfEdges", function () {
    const json = JSON.parse(readFileSync(resolve("assets/data/shapes/triangle.json"), "utf8"));
    const dcel = DCEL.buildFromGeoJSON(json);
    dcel.getInnerFaces()[0].getEdges()[0].bisect();

    expect(dcel.getInnerFaces()[0].getEdges().length).toBe(4);
    expect(dcel.getInnerFaces()[0].edge.twin.face.getEdges().length).toBe(4);
    expect(dcel.outerFace.getEdges(false).length).toBe(4);
    expect(dcel.getInnerFaces()[0].edge.twin.face.getEdges(false).length).toBe(4);
  });

  it("on one edge of a square results in 5 linked outer halfEdges", function () {
    const json = JSON.parse(readFileSync(resolve("assets/data/shapes/square.json"), "utf8"));
    const dcel = DCEL.buildFromGeoJSON(json);
    dcel.getInnerFaces()[0].getEdges()[0].bisect();

    expect(dcel.outerFace.getEdges().length).toBe(5);
    expect(dcel.getInnerFaces()[0].edge.twin.face.getEdges().length).toBe(5);
    expect(dcel.outerFace.getEdges(false).length).toBe(5);
    expect(dcel.getInnerFaces()[0].edge.twin.face.getEdges(false).length).toBe(5);
  });

  it("on one outer edge of a square results in 5 linked inner halfEdges", function () {
    const json = JSON.parse(readFileSync(resolve("assets/data/shapes/square.json"), "utf8"));
    const dcel = DCEL.buildFromGeoJSON(json);
    dcel.outerFace.edge.bisect();

    expect(dcel.getFaces().length).toBe(2);
    expect(dcel.halfEdges.length).toBe(10);

    expect(dcel.getInnerFaces()[0].getEdges().length).toBe(5);
    expect(dcel.outerFace.edge.twin.face.getEdges().length).toBe(5);
    expect(dcel.getInnerFaces()[0].getEdges(false).length).toBe(5);
    expect(dcel.outerFace.edge.twin.face.getEdges(false).length).toBe(5);
  });

  it("on one inneredge of a square results in 5 linked outer halfEdges", function () {
    const json = JSON.parse(readFileSync(resolve("assets/data/shapes/square.json"), "utf8"));
    const dcel = DCEL.buildFromGeoJSON(json);
    dcel.getInnerFaces()[0].edge.bisect();

    expect(dcel.getFaces().length).toBe(2);
    expect(dcel.halfEdges.length).toBe(10);

    expect(dcel.getInnerFaces()[0].edge.twin.face.getEdges().length).toBe(5);
    expect(dcel.outerFace.edge.face.getEdges().length).toBe(5);
    expect(dcel.getInnerFaces()[0].edge.twin.face.getEdges(false).length).toBe(5);
    expect(dcel.outerFace.edge.face.getEdges(false).length).toBe(5);
  });

  it("on the 1st outer edge of the first of 2 adjacent triangles results in 4 and 3 linked inner and 5 linked outer halfEdges", function () {
    const json = JSON.parse(
      readFileSync(resolve("assets/data/shapes/2triangle-adjacent.json"), "utf8")
    );
    const dcel = DCEL.buildFromGeoJSON(json);
    dcel.getInnerFaces()[0].getEdges()[1].bisect();

    expect(dcel.getFaces().length).toBe(3);
    expect(dcel.halfEdges.length).toBe(12);

    expect(dcel.getInnerFaces()[0].getEdges().length).toBe(4);
    expect(dcel.getInnerFaces()[0].getEdges(false).length).toBe(4);
    expect(dcel.getInnerFaces()[1].getEdges().length).toBe(3);
    expect(dcel.getInnerFaces()[1].getEdges(false).length).toBe(3);
    expect(dcel.outerFace.edge.face.getEdges().length).toBe(5);
    expect(dcel.outerFace.edge.face.getEdges(false).length).toBe(5);
  });

  it("on the 2nd outer edge of the first of 2 adjacent triangles results in 4 and 3 linked inner and 5 linked outer halfEdges", function () {
    const json = JSON.parse(
      readFileSync(resolve("assets/data/shapes/2triangle-adjacent.json"), "utf8")
    );
    const dcel = DCEL.buildFromGeoJSON(json);
    dcel.getInnerFaces()[0].getEdges()[2].bisect();

    expect(dcel.getFaces().length).toBe(3);
    expect(dcel.halfEdges.length).toBe(12);

    expect(dcel.getInnerFaces()[0].getEdges().length).toBe(4);
    expect(dcel.getInnerFaces()[0].getEdges(false).length).toBe(4);
    expect(dcel.getInnerFaces()[1].getEdges().length).toBe(3);
    expect(dcel.getInnerFaces()[1].getEdges(false).length).toBe(3);
    expect(dcel.outerFace.edge.face.getEdges().length).toBe(5);
    expect(dcel.outerFace.edge.face.getEdges(false).length).toBe(5);
  });
});

describe("subdivideToThreshold()", function () {
  it("turns an edge of length 2 into 8 edges (threshold factor 0.25)", function () {
    const json = JSON.parse(readFileSync(resolve("assets/data/shapes/square.json"), "utf8"));
    const dcel = DCEL.buildFromGeoJSON(json);
    const edge = dcel.getInnerFaces()[0].edge;
    dcel.setEpsilon(0.25);

    const halfEdgesBefore = dcel.halfEdges.length;
    edge.subdivideToThreshold(dcel.epsilon);
    const halfEdgesAfter = dcel.halfEdges.length;
    console.log(halfEdgesBefore, halfEdgesAfter);

    expect(halfEdgesAfter).toBe(halfEdgesBefore - 2 + 8 * 2);
  });

  it("turns an square with sides of length 2 into a dcel with 64 edges (threshold factor 0.25)", function () {
    const json = JSON.parse(readFileSync(resolve("assets/data/shapes/square.json"), "utf8"));
    const dcel = DCEL.buildFromGeoJSON(json);
    dcel.setEpsilon(0.25);
    dcel
      .getInnerFaces()[0]
      .getEdges()
      .forEach((edge) => edge.subdivideToThreshold(dcel.epsilon));

    expect(dcel.halfEdges.length).toBe(64);
  });
});
