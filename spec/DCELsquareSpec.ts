import fs from "fs";
import path from "path";
import Dcel from "../src/lib/DCEL/Dcel";

describe("A Dcel of a single square", function () {
  let dcel: Dcel;

  beforeEach(function () {
    const polygon = JSON.parse(fs.readFileSync(path.resolve("data/shapes/square.json"), "utf8"));
    dcel = Dcel.fromGeoJSON(polygon);
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
    expect(dcel.halfEdges.size).toBe(8);
  });

  it("has 4 linked inner edges", function () {
    expect(dcel.getBoundedFaces()[0].getEdges().length).toBe(4);
    expect(dcel.getBoundedFaces()[0].edge?.twin?.getCycle().length).toBe(4);
    expect(dcel.getBoundedFaces()[0].getEdges(false).length).toBe(4);
    expect(dcel.getBoundedFaces()[0].edge?.twin?.getCycle(false).length).toBe(4);
  });
});
