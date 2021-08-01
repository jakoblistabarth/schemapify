import fs from "fs";
import path from "path";
import Dcel from "../src/lib/DCEL/Dcel";

describe("A Dcel of a single triangle with one triangular hole", function () {
  let dcel: Dcel;

  beforeEach(function () {
    const polygon = JSON.parse(
      fs.readFileSync(path.resolve("data/shapes/triangle-hole.json"), "utf8")
    );
    dcel = Dcel.fromGeoJSON(polygon);
  });

  it("has 1 unbounded face", function () {
    expect(dcel.getUnboundedFace()).toEqual(jasmine.any(Object));
  });

  it("has 3 faces (1 outer, 2 inner) in total", function () {
    expect(dcel.getFaces().length).toBe(3);
  });

  it("has 6 vertices", function () {
    expect(dcel.vertices.size).toBe(6);
  });

  it("has 12 halfedges", function () {
    expect(dcel.halfEdges.size).toBe(12);
  });

  it("a counterclockwise halfedge of the hole has edges with a pointer to an outer Ring", function () {
    const innerFaces = dcel.getBoundedFaces();
    const innerRing = innerFaces.find((f) => f.outerRing);
    const holeLinkages = innerRing?.getEdges().every((e) => e.face?.outerRing);
    expect(holeLinkages).toBeTrue();
  });

  it("a counterclockwise halfedge of the outer ring has edges face with no pointer to an outer Ring", function () {
    const innerFaces = dcel.getBoundedFaces();
    const outerRing = innerFaces.find((f) => !f.outerRing);
    const holeLinkages = outerRing?.getEdges().every((e) => !e.face?.outerRing);
    expect(holeLinkages).toBeTrue();
  });
});
