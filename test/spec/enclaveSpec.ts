import fs from "fs";
import path from "path";
import Dcel from "../../src/DCEL/Dcel";

describe("A Dcel of an simplified enclave model", function () {
  let dcel: Dcel;

  beforeEach(function () {
    const polygon = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/enclave.json"), "utf8")
    );
    dcel = Dcel.fromGeoJSON(polygon);
  });

  it("has 1 unbounded face", function () {
    expect(dcel.getUnboundedFace()).toEqual(jasmine.any(Object));
  });

  it("has 3 faces", function () {
    expect(dcel.faces.length).toBe(3);
  });

  it("returns a geojson with 2 polygons", function () {
    const json = dcel.toGeoJSON();
    expect(json.features.length).toBe(2);
  });
});

describe("A Dcel of an simplified enclave model (reversed order)", function () {
  let dcel: Dcel;

  beforeEach(function () {
    const polygon = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/enclave2.json"), "utf8")
    );
    dcel = Dcel.fromGeoJSON(polygon);
  });

  it("has 1 unbounded face", function () {
    expect(dcel.getUnboundedFace()).toEqual(jasmine.any(Object));
  });

  it("has 3 faces", function () {
    expect(dcel.faces.length).toBe(3);
  });

  it("returns a geojson with 2 polygons", function () {
    const json = dcel.toGeoJSON();
    expect(json.features.length).toBe(2);
  });
});
