import fs from "fs";
import path from "path";
import HalfEdge from "@/src/Dcel/HalfEdge";
import Dcel from "@/src/Dcel/Dcel";
import Face from "@/src/Dcel/Face";

describe("replaceOuterRingEdge()", function () {
  let innerRing: Face;
  beforeEach(function () {
    const polygon = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/square-hole.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(polygon);
    innerRing = dcel.getBoundedFaces()[1];
  });

  it("only changes outerRing if edge which should be replaced is set as outerRing", function () {
    const existingHalfEdge = innerRing.outerRing?.edge as HalfEdge;
    const dcel = new Dcel();
    const v = dcel.addVertex(10, 10);
    const v2 = dcel.addVertex(11, 11);
    const testEdge = dcel.addHalfEdge(v, v2);

    innerRing.replaceOuterRingEdge(existingHalfEdge, testEdge);
    expect(innerRing.outerRing?.edge).toEqual(testEdge);
  });

  it("does not change outerRing if edge which should be replaced is not set as outerRing", function () {
    const existingHalfEdge = innerRing.outerRing?.edge;
    const dcel = new Dcel();
    const v = dcel.addVertex(10, 10);
    const v2 = dcel.addVertex(11, 11);
    const testEdge = dcel.addHalfEdge(v, v2);

    innerRing.replaceOuterRingEdge(testEdge, testEdge);
    expect(innerRing.outerRing?.edge).toEqual(existingHalfEdge);
  });
});
