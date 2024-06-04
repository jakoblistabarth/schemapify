import fs from "fs";
import path from "path";
import Dcel from "@/src/Dcel/Dcel";
import Face from "@/src/Dcel/Face";
import Subdivision from "@/src/geometry/Subdivision";

describe("A Dcel from a geojson with a simplified enclave model", function () {
  let dcel: Dcel;

  beforeEach(function () {
    const polygon = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/enclave.json"), "utf8"),
    );
    dcel = Dcel.fromGeoJSON(polygon);
  });

  it("has 1 unbounded face", function () {
    expect(dcel.getUnboundedFace()).toBeInstanceOf(Face);
  });

  it("has 3 faces", function () {
    expect(dcel.faces.length).toBe(3);
  });

  xit("returns a subdivision with 2 polygons", function () {
    const subdivision = dcel.toSubdivision();
    expect(subdivision.multiPolygons.length).toBe(2);
  });
});

describe("A Dcel from multipolygons of a simplified enclave model", function () {
  let dcel: Dcel;

  beforeEach(function () {
    const s = Subdivision.fromCoordinates([
      [
        [
          [
            [0, 0],
            [2, 0],
            [2, 2],
            [0, 2],
          ],
          [
            [0.5, 0.5],
            [1.5, 0.5],
            [1.5, 1.5],
            [0.5, 1.5],
          ],
        ],
      ],
      [
        [
          [
            [0.5, 0.5],
            [1.5, 0.5],
            [1.5, 1.5],
            [0.5, 1.5],
          ],
        ],
      ],
    ]);
    dcel = Dcel.fromSubdivision(s);
  });

  it("has 1 unbounded face", function () {
    expect(dcel.getUnboundedFace()).toBeInstanceOf(Face);
  });

  it("has 3 faces", function () {
    expect(dcel.faces.length).toBe(3);
  });

  xit("returns a subdivision with 2 polygons", function () {
    const subdivision = dcel.toSubdivision();
    expect(subdivision.multiPolygons.length).toBe(2);
  });
});

describe("A Dcel of an simplified enclave model (reversed order)", function () {
  let dcel: Dcel;

  beforeEach(function () {
    const polygon = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/enclave2.json"), "utf8"),
    );
    dcel = Dcel.fromGeoJSON(polygon);
  });

  it("has 1 unbounded face", function () {
    expect(dcel.getUnboundedFace()).toBeInstanceOf(Face);
  });

  it("has 3 faces", function () {
    expect(dcel.faces.length).toBe(3);
  });

  it("returns a subdivision with 2 polygons", function () {
    const subdivision = dcel.toSubdivision();
    expect(subdivision.multiPolygons.length).toBe(2);
  });
});
