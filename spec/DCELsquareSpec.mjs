import DCEL from "../assets/lib/dcel/Dcel.mjs";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("A DCEL of a single square", function () {
  let dcel;

  beforeEach(function () {
    const polygon = JSON.parse(readFileSync(resolve("assets/data/shapes/square.json"), "utf8"));
    dcel = DCEL.buildFromGeoJSON(polygon);
  });

  it("has 1 outerface", function () {
    expect(dcel.outerFace).toEqual(jasmine.any(Object));
  });

  it("has 2 faces", function () {
    expect(dcel.faces.length).toBe(2);
  });

  it("has 4 vertices", function () {
    expect(Object.keys(dcel.vertices).length).toBe(4);
  });

  it("has 8 edges", function () {
    expect(dcel.halfEdges.length).toBe(8);
  });

  it("has 4 linked outer edges", function () {
    expect(dcel.outerFace.getEdges().length).toBe(4);
    expect(dcel.faces[1].edge.twin.face.getEdges().length).toBe(4);
    expect(dcel.outerFace.getEdges(false).length).toBe(4);
    expect(dcel.faces[1].edge.twin.face.getEdges(false).length).toBe(4);
  });

  it("has 4 linked inner edges", function () {
    expect(dcel.faces[1].getEdges().length).toBe(4);
    expect(dcel.outerFace.edge.twin.face.getEdges().length).toBe(4);
    expect(dcel.faces[1].getEdges(false).length).toBe(4);
    expect(dcel.outerFace.edge.twin.face.getEdges(false).length).toBe(4);
  });
});
