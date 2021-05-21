import DCEL from "../assets/lib/dcel/Dcel.mjs";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("replaceOuterRingEdge()", function () {
  let innerRing;
  beforeEach(function () {
    const polygon = JSON.parse(
      readFileSync(resolve("assets/data/shapes/square-hole.json"), "utf8")
    );
    const dcel = DCEL.buildFromGeoJSON(polygon);
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
