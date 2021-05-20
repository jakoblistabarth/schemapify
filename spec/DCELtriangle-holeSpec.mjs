import DCEL from "../assets/lib/dcel/Dcel.mjs";
import Vertex from "../assets/lib/dcel/Vertex.mjs";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("A DCEL of a single triangle with one triangular hole", function () {
  let dcel;

  beforeEach(function () {
    const polygon = JSON.parse(
      readFileSync(resolve("assets/data/shapes/triangle-hole.json"), "utf8")
    );
    dcel = DCEL.buildFromGeoJSON(polygon);
  });

  it("has 1 outerface", function () {
    expect(dcel.outerFace).toEqual(jasmine.any(Object));
  });

  it("has 3 faces (1 outer, 2 inner) in total", function () {
    expect(dcel.getFaces().length).toBe(3);
  });

  it("has 6 vertices", function () {
    expect(Object.values(dcel.vertices).length).toBe(6);
  });

  it("has 12 halfedges", function () {
    expect(dcel.halfEdges.length).toBe(12);
  });

  it("an counterclockwise halfedge of the hole has edges with property ringType 'inner'", function () {
    const innerFaces = dcel.getInnerFaces();
    const innerRing = innerFaces.find((f) => f.ringType == "inner");
    innerRing.getEdges().forEach((e) => {
      expect(e.face.ringType).toBe("inner");
    });
  });

  it("an counterclockwise halfedge of the outer ring has edges face with property ringType 'outer'", function () {
    const innerFaces = dcel.getInnerFaces();
    const outerRing = innerFaces.find((f) => f.ringType == "outer");
    outerRing.getEdges().forEach((e) => {
      expect(e.face.ringType).toBe("outer");
    });
  });
});
