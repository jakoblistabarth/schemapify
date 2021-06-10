import DCEL from "../assets/lib/dcel/Dcel.mjs";
import HalfEdge from "../assets/lib/dcel/HalfEdge.mjs";
import Vertex from "../assets/lib/dcel/Vertex.mjs";
import { readFileSync } from "fs";
import { resolve } from "path";
import { getTestFiles } from "./test-helpers.mjs";

describe("getLength()", function () {
  it("returns the correct length for a single halfEdge", function () {
    const a = new Vertex(0, 0);
    const b = new Vertex(2, 0);
    const edge = new HalfEdge(a);
    edge.twin = new HalfEdge(b);
    edge.twin.twin = edge;

    expect(edge.getLength()).toEqual(2);
  });

  it("returns the correct length for all sides of a square", function () {
    const json = JSON.parse(readFileSync(resolve("assets/data/shapes/square.json"), "utf8"));
    const dcel = DCEL.fromGeoJSON(json);

    dcel
      .getBoundedFaces()[0]
      .edge.getCycle()
      .forEach((e) => {
        expect(e.getLength()).toBe(2);
      });
  });

  it("returns the correct length for the sides of a triangle", function () {
    const json = JSON.parse(readFileSync(resolve("assets/data/shapes/triangle.json"), "utf8"));
    const dcel = DCEL.fromGeoJSON(json);

    const lengths = dcel
      .getBoundedFaces()[0]
      .edge.getCycle()
      .map((e) => e.getLength());
    expect(lengths.sort()).toEqual([14.142135623730951, 14.142135623730951, 20]);
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

describe("distanceToEdge()", function () {
  it("returns the minimum distance between 2 edges", function () {
    const a = new Vertex(0, 0);
    const b = new Vertex(-10, 10);
    const v = new Vertex(-1, -2);
    const w = new Vertex(2, 1);

    const ab = new HalfEdge(a);
    ab.twin = new HalfEdge(b);
    ab.twin.twin = ab;

    const vw = new HalfEdge(v);
    vw.twin = new HalfEdge(w);
    vw.twin.twin = vw;

    expect(ab.distanceToEdge(vw)).toEqual(Math.sqrt(0.5));
    expect(vw.distanceToEdge(ab)).toEqual(Math.sqrt(0.5));
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
    const dcel = DCEL.fromGeoJSON(json);

    expect(dcel.getBoundedFaces()[0].edge.getCycle().length).toBe(4);
    expect(dcel.getBoundedFaces()[0].edge.twin.getCycle().length).toBe(4);
  });

  it("returns the correct number of edges for a triangle", function () {
    const json = JSON.parse(readFileSync(resolve("assets/data/shapes/triangle.json"), "utf8"));
    const dcel = DCEL.fromGeoJSON(json);

    expect(dcel.getBoundedFaces()[0].edge.getCycle().length).toBe(3);
    expect(dcel.getBoundedFaces()[0].edge.twin.getCycle().length).toBe(3);
  });
});

describe("bisect() on geodata results in a DCEL", function () {
  const dir = "assets/data/geodata";
  const testFiles = getTestFiles(dir);

  testFiles.forEach((file) => {
    it(
      "with complete cycles for all faces in counter-clockwise and clockwise direction of file " +
        file,
      function () {
        const json = JSON.parse(readFileSync(resolve(dir + "/" + file), "utf8"));
        const dcel = DCEL.fromGeoJSON(json);
        dcel.getBoundedFaces().forEach((f) => f.getEdges().forEach((e) => e.bisect()));

        const cycles = [];
        dcel.getBoundedFaces().forEach((f) => {
          cycles.push(f.getEdges());
          cycles.push(f.getEdges(false));
        });

        expect(cycles).nothing();
      }
    );
  });
});

describe("bisect() on simple shapes results in a DCEL", function () {
  const dir = "assets/data/shapes";
  const testFiles = getTestFiles(dir);

  testFiles.forEach((file) => {
    it(
      "with complete cycles for all faces in counter-clockwise and clockwise direction of file " +
        file,
      function () {
        const json = JSON.parse(readFileSync(resolve(dir + "/" + file), "utf8"));
        const dcel = DCEL.fromGeoJSON(json);
        dcel.getBoundedFaces().forEach((f) => f.getEdges().forEach((e) => e.bisect()));

        const cycles = [];
        dcel.getBoundedFaces().forEach((f) => {
          cycles.push(f.getEdges());
          cycles.push(f.getEdges(false));
        });

        expect(cycles).nothing();
      }
    );
  });
});

describe("bisect()", function () {
  it("on one edge of a triangle results in 4 linked halfEdges", function () {
    const json = JSON.parse(readFileSync(resolve("assets/data/shapes/triangle.json"), "utf8"));
    const dcel = DCEL.fromGeoJSON(json);
    dcel.getBoundedFaces()[0].getEdges()[0].bisect();

    expect(dcel.getBoundedFaces()[0].getEdges().length).toBe(4);
    expect(dcel.getBoundedFaces()[0].getEdges(false).length).toBe(4);
    expect(dcel.getBoundedFaces()[0].edge.twin.getCycle().length).toBe(4);
    expect(dcel.getBoundedFaces()[0].edge.twin.getCycle(false).length).toBe(4);
  });

  it("on one edge of a square results in 5 linked outer halfEdges", function () {
    const json = JSON.parse(readFileSync(resolve("assets/data/shapes/square.json"), "utf8"));
    const dcel = DCEL.fromGeoJSON(json);
    dcel.getBoundedFaces()[0].getEdges()[0].bisect();

    expect(dcel.getBoundedFaces()[0].edge.twin.getCycle().length).toBe(5);
    expect(dcel.getBoundedFaces()[0].edge.twin.getCycle(false).length).toBe(5);
  });

  it("on one outer edge of a square results in 5 linked inner halfEdges", function () {
    const json = JSON.parse(readFileSync(resolve("assets/data/shapes/square.json"), "utf8"));
    const dcel = DCEL.fromGeoJSON(json);
    dcel.getBoundedFaces()[0].edge.twin.bisect();

    expect(dcel.getFaces().length).toBe(2);
    expect(dcel.halfEdges.length).toBe(10);

    expect(dcel.getBoundedFaces()[0].getEdges().length).toBe(5);
    expect(dcel.getBoundedFaces()[0].getEdges(false).length).toBe(5);
  });

  it("on one inneredge of a square results in 5 linked outer halfEdges", function () {
    const json = JSON.parse(readFileSync(resolve("assets/data/shapes/square.json"), "utf8"));
    const dcel = DCEL.fromGeoJSON(json);
    dcel.getBoundedFaces()[0].edge.bisect();

    expect(dcel.getFaces().length).toBe(2);
    expect(dcel.halfEdges.length).toBe(10);

    expect(dcel.getBoundedFaces()[0].edge.twin.getCycle().length).toBe(5);
    expect(dcel.getBoundedFaces()[0].edge.twin.getCycle(false).length).toBe(5);
  });

  it("on the 1st outer edge of the first of 2 adjacent triangles results in 4 and 3 linked inner and 5 linked outer halfEdges", function () {
    const json = JSON.parse(
      readFileSync(resolve("assets/data/shapes/2triangle-adjacent.json"), "utf8")
    );
    const dcel = DCEL.fromGeoJSON(json);
    dcel.getBoundedFaces()[0].getEdges()[1].bisect();

    expect(dcel.getFaces().length).toBe(3);
    expect(dcel.halfEdges.length).toBe(12);

    expect(dcel.getBoundedFaces()[0].getEdges().length).toBe(4);
    expect(dcel.getBoundedFaces()[0].getEdges(false).length).toBe(4);
    expect(dcel.getBoundedFaces()[1].getEdges().length).toBe(3);
    expect(dcel.getBoundedFaces()[1].getEdges(false).length).toBe(3);
    expect(dcel.getBoundedFaces()[0].edge.twin.getCycle().length).toBe(5);
    expect(dcel.getBoundedFaces()[0].edge.twin.getCycle(false).length).toBe(5);
  });

  it("on the 2nd outer edge of the first of 2 adjacent triangles results in 4 and 3 linked inner and 5 linked outer halfEdges", function () {
    const json = JSON.parse(
      readFileSync(resolve("assets/data/shapes/2triangle-adjacent.json"), "utf8")
    );
    const dcel = DCEL.fromGeoJSON(json);
    dcel.getBoundedFaces()[0].getEdges()[2].bisect();

    expect(dcel.getFaces().length).toBe(3);
    expect(dcel.halfEdges.length).toBe(12);

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
    const json = JSON.parse(readFileSync(resolve("assets/data/shapes/square.json"), "utf8"));
    const dcel = DCEL.fromGeoJSON(json);
    const edge = dcel.getBoundedFaces()[0].edge;

    const halfEdgesBefore = dcel.halfEdges.length;
    edge.subdivideToThreshold(0.5);
    const halfEdgesAfter = dcel.halfEdges.length;

    expect(halfEdgesAfter).toBe(halfEdgesBefore - 2 + 8 * 2);
  });

  it("turns an square with sides of length 2 into a dcel with 64 edges (epsilon: .5)", function () {
    const json = JSON.parse(readFileSync(resolve("assets/data/shapes/square.json"), "utf8"));
    const dcel = DCEL.fromGeoJSON(json);

    dcel.splitEdges(0.5);

    expect(dcel.halfEdges.length).toBe(64);
  });
});
