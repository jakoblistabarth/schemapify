import DCEL from "../dist/cjs/lib/dcel/Dcel.js";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("A DCEL of a single square", function () {
  let dcel;

  beforeEach(function () {
    const polygon = JSON.parse(readFileSync(resolve("assets/data/shapes/square.json"), "utf8"));
    dcel = DCEL.fromGeoJSON(polygon);
  });

  it("has 1 unbounded face", function () {
    expect(dcel.getUnboundedFace()).toEqual(jasmine.any(Object));
  });

  it("has 2 faces", function () {
    expect(dcel.faces.length).toBe(2);
  });

  it("has 4 vertices", function () {
    expect(dcel.vertices.size).toBe(4);
  });

  it("has 8 edges", function () {
    expect(dcel.halfEdges.length).toBe(8);
  });

  it("has 4 linked inner edges", function () {
    expect(dcel.getBoundedFaces()[0].getEdges().length).toBe(4);
    expect(dcel.getBoundedFaces()[0].edge.twin.getCycle().length).toBe(4);
    expect(dcel.getBoundedFaces()[0].getEdges(false).length).toBe(4);
    expect(dcel.getBoundedFaces()[0].edge.twin.getCycle(false).length).toBe(4);
  });
});
