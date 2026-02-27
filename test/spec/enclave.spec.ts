import Dcel from "@/src/Dcel/Dcel";
import Face from "@/src/Dcel/Face";
import Subdivision from "@/src/geometry/Subdivision";
import fs from "fs";
import path from "path";
import { beforeEach, describe, expect, test } from "vitest";

describe("A Dcel from a geojson with a simplified enclave model", function () {
  let dcel: Dcel;

  beforeEach(function () {
    const polygon = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/enclave.json"), "utf8"),
    );
    dcel = Dcel.fromGeoJSON(polygon);
  });

  test("has 1 unbounded face", function () {
    expect(dcel.getUnboundedFace()).toBeInstanceOf(Face);
  });

  test("has 3 faces", function () {
    expect(dcel.faces.length).toBe(3);
  });

  test("returns a subdivision with 2 polygons", function () {
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

  test("has 1 unbounded face", function () {
    expect(dcel.getUnboundedFace()).toBeInstanceOf(Face);
  });

  test("has 3 faces", function () {
    expect(dcel.faces.length).toBe(3);
  });

  test("returns a subdivision with 2 polygons", function () {
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

  test("has 1 unbounded face", function () {
    expect(dcel.getUnboundedFace()).toBeInstanceOf(Face);
  });

  test("has 3 faces", function () {
    expect(dcel.faces.length).toBe(3);
  });

  test("returns a subdivision with 2 polygons", function () {
    const subdivision = dcel.toSubdivision();
    expect(subdivision.multiPolygons.length).toBe(2);
  });
});
