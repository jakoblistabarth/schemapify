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

  it("has 1 unbounded face", function () {
    expect(dcel.getUnboundedFace()).toEqual(jasmine.any(Object));
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

  it("a counterclockwise halfedge of the hole has edges with a pointer to an outer Ring", function () {
    const innerFaces = dcel.getInnerFaces();
    const innerRing = innerFaces.find((f) => f.outerRing);
    innerRing.getEdges().forEach((e) => {
      expect(e.face.outerRing).toBeDefined();
    });
  });

  it("a counterclockwise halfedge of the outer ring has edges face with no pointer to an outer Ring", function () {
    const innerFaces = dcel.getInnerFaces();
    const outerRing = innerFaces.find((f) => !f.outerRing);
    outerRing.edge.getCycle().forEach((e) => {
      expect(e.face.outerRing).toBe(null);
    });
  });
});
