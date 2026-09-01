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

describe("getRings()", function () {
  /** A square with a square hole in it. */
  const squareWithHole = () =>
    Dcel.fromGeoJSON(
      JSON.parse(
        readFileSync(path.resolve("test/data/shapes/square-hole.json"), "utf8"),
      ),
    );

  test("gives the ring around the face, followed by the one around each hole", function () {
    const dcel = squareWithHole();
    const enclosing = dcel
      .getBoundedFaces()
      .find((face) => face.innerEdges.length > 0);
    if (!enclosing) throw new Error("expected a face with a hole");

    const rings = enclosing.getRings();

    expect(rings.length).toBe(1 + enclosing.innerEdges.length);
    // The first is the one the face's own edge belongs to, which is all its cycle
    // reaches; the hole is only reachable through the face's inner edges.
    expect(rings[0]).toEqual(enclosing.getEdges());
    expect(rings[1]).toContain(enclosing.innerEdges[0]);
  });

  test("gives one ring for a face without holes", function () {
    const dcel = squareWithHole();
    const hole = dcel.getBoundedFaces().find((face) => face.isHole);
    if (!hole) throw new Error("expected a hole");

    expect(hole.getRings().length).toBe(1);
  });
});

describe("Removing a HalfEdge from the Dcel", function () {
  test("gives up its registration as the inner edge of a face", function () {
    const dcel = Dcel.fromGeoJSON(
      JSON.parse(
        readFileSync(path.resolve("test/data/shapes/square-hole.json"), "utf8"),
      ),
    );
    const enclosing = dcel
      .getBoundedFaces()
      .find((face) => face.innerEdges.length > 0);
    const innerEdge = enclosing?.innerEdges[0];
    if (!enclosing || !innerEdge)
      throw new Error("expected a face with a hole");

    // Removed through the Dcel rather than through the edge, as merging a vertex
    // away does: a face left holding a gone edge walks its hole from nowhere.
    dcel.removeHalfEdge(innerEdge);

    expect(enclosing.innerEdges).not.toContain(innerEdge);
  });
});
