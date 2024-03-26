import fs from "fs";
import path from "path";
import Dcel from "../../src/DCEL/Dcel";
import Face from "../../src/DCEL/Face";
import MultiPolygon from "../../src/geometry/MultiPolygon";

describe("A Dcel from a geojson feature collection of a single square with one square hole", function () {
  let dcel: Dcel;

  beforeEach(function () {
    const polygon = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/square-hole.json"),
        "utf8",
      ),
    );
    dcel = Dcel.fromGeoJSON(polygon);
  });

  it("has 1 unbounded face", function () {
    expect(dcel.getUnboundedFace()).toBeInstanceOf(Face);
  });

  it("has 3 faces (1 outer, 2 inner) in total", function () {
    expect(dcel.getFaces().length).toBe(3);
  });

  it("has 8 vertices", function () {
    expect(dcel.vertices.size).toBe(8);
  });

  it("has 16 halfedges", function () {
    expect(dcel.halfEdges.size).toBe(16);
  });
});

describe("A Dcel from a list of MultiPolygons of a single square with one square hole", function () {
  let dcel: Dcel;

  beforeEach(function () {
    const m = MultiPolygon.fromCoordinates([
      [
        [
          [0, 0],
          [2, 0],
          [2, 2],
          [0, 2],
        ],
        [
          [1.25, 1.25],
          [1.25, 1.5],
          [1.5, 1.5],
          [1.5, 1.25],
        ],
      ],
    ]);
    dcel = Dcel.fromMultiPolygons([m]);
  });

  it("has 1 unbounded face", function () {
    expect(dcel.getUnboundedFace()).toBeInstanceOf(Face);
  });

  it("has 3 faces (1 outer, 2 inner) in total", function () {
    expect(dcel.getFaces().length).toBe(3);
  });

  it("has 8 vertices", function () {
    expect(dcel.vertices.size).toBe(8);
  });

  it("has 16 halfedges", function () {
    expect(dcel.halfEdges.size).toBe(16);
  });
});
