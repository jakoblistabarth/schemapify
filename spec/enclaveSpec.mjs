import DCEL from "../assets/lib/dcel/Dcel.mjs";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("A DCEL of an simplified enclave model", function () {
  let dcel;

  beforeEach(function () {
    const polygon = JSON.parse(readFileSync(resolve("assets/data/shapes/enclave.json"), "utf8"));
    dcel = DCEL.fromGeoJSON(polygon);
  });

  it("has 1 unbounded face", function () {
    expect(dcel.getUnboundedFace()).toEqual(jasmine.any(Object));
  });

  it("has 3 faces", function () {
    expect(dcel.faces.length).toBe(3);
  });

  it("returns a geojson with 2 polygons", function () {
    const json = dcel.toGeoJSON("enclave");
    expect(json.features.length).toBe(2);
  });
});

describe("A DCEL of an simplified enclave model (reversed order)", function () {
  let dcel;

  beforeEach(function () {
    const polygon = JSON.parse(readFileSync(resolve("assets/data/shapes/enclave2.json"), "utf8"));
    dcel = DCEL.fromGeoJSON(polygon);
  });

  it("has 1 unbounded face", function () {
    expect(dcel.getUnboundedFace()).toEqual(jasmine.any(Object));
  });

  it("has 3 faces", function () {
    expect(dcel.faces.length).toBe(3);
  });

  it("returns a geojson with 2 polygons", function () {
    const json = dcel.toGeoJSON("enclave2");
    expect(json.features.length).toBe(2);
  });
});
