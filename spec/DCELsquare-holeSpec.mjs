import DCEL from "../assets/lib/dcel/Dcel.mjs";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("A DCEL of a single square with one square hole", function () {
  let dcel;

  beforeEach(function () {
    const polygon = JSON.parse(
      readFileSync(resolve("assets/data/shapes/square-hole.json"), "utf8")
    );
    dcel = DCEL.buildFromGeoJSON(polygon);
  });

  it("has 1 unbounded face", function () {
    expect(dcel.getUnboundedFace()).toEqual(jasmine.any(Object));
  });

  it("has 3 faces (1 outer, 2 inner) in total", function () {
    expect(dcel.getFaces().length).toBe(3);
  });

  it("has 8 vertices", function () {
    expect(Object.values(dcel.vertices).length).toBe(8);
  });

  it("has 16 halfedges", function () {
    expect(dcel.halfEdges.length).toBe(16);
  });
});
