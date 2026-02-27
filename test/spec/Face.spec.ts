import Dcel from "@/src/Dcel/Dcel";
import Face from "@/src/Dcel/Face";
import HalfEdge from "@/src/Dcel/HalfEdge";
import { readFileSync } from "fs";
import path from "path";
import { beforeEach, describe, expect, test } from "vitest";

describe("replaceOuterRingEdge()", function () {
  let innerRing: Face;
  beforeEach(function () {
    const polygon = JSON.parse(
      readFileSync(path.resolve("test/data/shapes/square-hole.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(polygon);
    innerRing = dcel.getBoundedFaces()[1];
  });

  test("only changes outerRing if edge which should be replaced is set as outerRing", function () {
    const existingHalfEdge = innerRing.outerRing?.edge as HalfEdge;
    const dcel = new Dcel();
    const v = dcel.addVertex(10, 10);
    const v2 = dcel.addVertex(11, 11);
    const testEdge = dcel.addHalfEdge(v, v2);

    innerRing.replaceOuterRingEdge(existingHalfEdge, testEdge);
    expect(innerRing.outerRing?.edge).toEqual(testEdge);
  });

  test("does not change outerRing if edge which should be replaced is not set as outerRing", function () {
    const existingHalfEdge = innerRing.outerRing?.edge;
    const dcel = new Dcel();
    const v = dcel.addVertex(10, 10);
    const v2 = dcel.addVertex(11, 11);
    const testEdge = dcel.addHalfEdge(v, v2);

    innerRing.replaceOuterRingEdge(testEdge, testEdge);
    expect(innerRing.outerRing?.edge).toEqual(existingHalfEdge);
  });
});
