import fs from "fs";
import path from "path";
import Dcel from "../dist/cjs/lib/dcel/Dcel";

describe("replaceOuterRingEdge()", function () {
  let innerRing;
  beforeEach(function () {
    const polygon = JSON.parse(
      fs.readFileSync(path.resolve("assets/data/shapes/square-hole.json"), "utf8")
    );
    const dcel = Dcel.fromGeoJSON(polygon);
    innerRing = dcel.getBoundedFaces()[1];
  });

  it("only changes outerRing if edge which should be replaced is set as outerRing", function () {
    const existingHalfEdge = innerRing.outerRing.edge;

    innerRing.replaceOuterRingEdge(existingHalfEdge, "testEdge");
    expect(innerRing.outerRing.edge).toEqual("testEdge");
  });

  it("does not change outerRing if edge which should be replaced is not set as outerRing", function () {
    const existingHalfEdge = innerRing.outerRing.edge;

    innerRing.replaceOuterRingEdge("fakeEdge", "testEdge");
    expect(innerRing.outerRing.edge).toEqual(existingHalfEdge);
  });
});
