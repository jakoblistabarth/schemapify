import fs from "fs";
import path from "path";
import Dcel from "@/src/Dcel/Dcel";
import Face from "@/src/Dcel/Face";

describe("A Dcel of a single triangle with one triangular hole", function () {
  let dcel: Dcel;

  beforeEach(function () {
    const polygon = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/triangle-hole.json"),
        "utf8",
      ),
    );
    dcel = Dcel.fromGeoJSON(polygon);
  });

  it("has 1 unbounded face", function () {
    expect(dcel.getUnboundedFace()).toBeInstanceOf(Face);
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
    expect(holeLinkages).toBe(true);
  });

  it("a counterclockwise halfedge of the outer ring has edges face with no pointer to an outer Ring", function () {
    const innerFaces = dcel.getBoundedFaces();
    const outerRing = innerFaces.find((f) => !f.outerRing);
    const holeLinkages = outerRing?.getEdges().every((e) => !e.face?.outerRing);
    expect(holeLinkages).toBe(true);
  });
});
