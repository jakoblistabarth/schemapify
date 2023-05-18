import fs from "fs";
import path from "path";
//@ts-ignore
import { hint } from "@mapbox/geojsonhint";
import { getTestFiles } from "./test-setup";
import Dcel from "../../src/DCEL/Dcel";

describe("DCELtoGeoJSON creates a valid geoJSON of a square with a hole", function () {
  it("despite converting it to a multipolygon, the number of outer and inner rings stays the same.", function () {
    const squareOriginal = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/square-hole.json"), "utf8")
    );
    const dcel = Dcel.fromGeoJSON(squareOriginal);
    const squareGenerated = dcel.toGeoJSON();

    const featureNew = squareGenerated.features[0]
      .geometry as GeoJSON.MultiPolygon;

    expect(featureNew.coordinates.length).toBe(1);
    expect(featureNew.coordinates[0].length).toBe(2);
    expect(featureNew.coordinates[0][0].length).toBe(5);
    expect(featureNew.coordinates[0][1].length).toBe(5);
  });
});

describe("DCELtoGeoJSON creates a valid geoJSON of simple shapes", function () {
  const dir = "test/data/shapes";
  const testFiles = getTestFiles(dir);

  testFiles.forEach((file) => {
    xit("based on a DCEL of " + file, function () {
      const inputJson = JSON.parse(
        fs.readFileSync(path.resolve(dir + "/" + file), "utf8")
      );
      const dcel = Dcel.fromGeoJSON(inputJson);
      const outputJson = dcel.toGeoJSON();
      const outputJsonPretty = JSON.stringify(outputJson, null, 4);
      const errors = hint(outputJsonPretty);
      expect(errors.length).toBe(0);
      expect(inputJson.features.length).toBe(outputJson.features.length);
    });
  });
});

describe("DCELtoGeoJSON creates a valid geoJSON of geodata", function () {
  const dir = "test/data/geodata";
  const testFiles = getTestFiles(dir);

  testFiles.forEach((file) => {
    xit("based on a DCEL of " + file, function () {
      const inputJson = JSON.parse(
        fs.readFileSync(path.resolve(dir + "/" + file), "utf8")
      );
      const dcel = Dcel.fromGeoJSON(inputJson);
      const outputJson = dcel.toGeoJSON();
      const outputJsonPretty = JSON.stringify(outputJson, null, 4);
      const errors = hint(outputJsonPretty);
      // fs.writeFileSync("/tmp/test" + file, outputJsonPretty);
      expect(errors.length).toBe(0);
      expect(inputJson.features.length).toBe(outputJson.features.length);
    });
  });
});
