import fs from "fs";
import path from "path";
import Dcel from "../src/lib/DCEL/Dcel";
import FaceFaceBoundaries from "../src/lib/c-oriented-schematization/FaceFaceBoundaries";

describe("createFaceFaceBoundaries()", function () {
  it("on a dcel of 2 adjacent squares returns 3 facefaceBoundaries with the correct number of Edges", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("data/shapes/2plgn-adjacent.json"), "utf8")
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel.facefaceBoundaries = new FaceFaceBoundaries(dcel);
    const ffb = new FaceFaceBoundaries(dcel);
    const lengths = [...ffb.boundaries].map(([k, e]) => e.length).sort();

    expect(ffb.boundaries.size).toBe(3);
    expect(lengths).toEqual([1, 3, 3]);
  });

  it("on a dcel of 3 adjacent squares returns 5 facefaceBoundaries with the correct number of Edges", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("data/shapes/3plgn-adjacent.json"), "utf8")
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel.facefaceBoundaries = new FaceFaceBoundaries(dcel);
    const ffb = new FaceFaceBoundaries(dcel);
    const lengths = [...ffb.boundaries].map(([k, e]) => e.length).sort();

    expect(ffb.boundaries.size).toBe(5);
    expect(lengths).toEqual([1, 1, 2, 3, 3]);
  });
});
