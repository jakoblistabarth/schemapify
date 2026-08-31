import Dcel from "@/src/Dcel/Dcel";
import Face from "@/src/Dcel/Face";
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
    dcel = Dcel.fromCoordinates([
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

describe("A Dcel of an enclave whose ring starts at a different vertex than the hole", function () {
  let dcel: Dcel;

  beforeEach(function () {
    dcel = Dcel.fromCoordinates([
      [
        [
          [
            [0, 0],
            [4, 0],
            [4, 4],
            [0, 4],
          ],
          [
            [1, 1],
            [3, 1],
            [3, 3],
            [1, 3],
          ],
        ],
      ],
      // The same ring as the hole above, but starting at another vertex.
      // Subdividing moves a face's edge away from the registered inner edge,
      // so the two rings drift apart before a Dcel is rebuilt from them.
      [
        [
          [
            [3, 3],
            [1, 3],
            [1, 1],
            [3, 1],
          ],
        ],
      ],
    ]);
  });

  test("has 3 faces", function () {
    expect(dcel.faces.length).toBe(3);
  });

  test("lets the enclave and the hole share one face", function () {
    const shared = dcel.faces.filter((f) => f.associatedFeatures.length > 1);
    expect(shared.length).toBe(1);
  });

  test("has no face whose edge belongs to another face", function () {
    expect(dcel.faces.filter((f) => f.edge && f.edge.face !== f).length).toBe(
      0,
    );
  });

  test("returns a subdivision with 2 polygons", function () {
    expect(dcel.toSubdivision().multiPolygons.length).toBe(2);
  });
});
