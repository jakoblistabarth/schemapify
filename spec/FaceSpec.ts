import fs from "fs";
import path from "path";
import Dcel from "../src/lib/dcel/Dcel";
import Face from "../src/lib/dcel/Face";

describe("replaceOuterRingEdge()", function () {
  let innerRing: Face;
  beforeEach(function () {
    const polygon = JSON.parse(
      fs.readFileSync(path.resolve("data/shapes/square-hole.json"), "utf8")
    );
    const dcel = Dcel.fromGeoJSON(polygon);
    innerRing = dcel.getBoundedFaces()[1];
  });

  it("only changes outerRing if edge which should be replaced is set as outerRing", function () {
    const existingHalfEdge = innerRing.outerRing.edge;

    // @ts-ignore // FIXME: Fix type error
    innerRing.replaceOuterRingEdge(existingHalfEdge, "testEdge");
    // @ts-ignore // FIXME: Fix type error
    expect(innerRing.outerRing.edge).toEqual("testEdge");
  });

  it("does not change outerRing if edge which should be replaced is not set as outerRing", function () {
    const existingHalfEdge = innerRing.outerRing.edge;

    // @ts-ignore // FIXME: Fix type error
    innerRing.replaceOuterRingEdge("fakeEdge", "testEdge");
    expect(innerRing.outerRing.edge).toEqual(existingHalfEdge);
  });
});
