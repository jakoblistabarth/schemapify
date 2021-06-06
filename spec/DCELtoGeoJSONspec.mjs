import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { getTestFiles } from "./test-helpers.mjs";
import DcelConverter from "../assets/lib/dcel/DcelConverter.mjs";
import Dcel from "../assets/lib/dcel/Dcel.mjs";
import { hint } from "@mapbox/geojsonhint";

describe("DCELtoGeoJSON creates a valid geoJSON", function () {
  it("of 2plgn-islands-holes", function () {
    const inputJson = JSON.parse(
      readFileSync(resolve("assets/data/shapes/2plgn-islands-hole.json"), "utf8")
    );
    const dcel = Dcel.fromGeoJSON(inputJson);
    const dcelC = new DcelConverter(dcel);
    const outputJson = dcelC.toGeoJSON("2plgn-islands-holes");
    const outputJsonPretty = JSON.stringify(outputJson, null, 4);
    const errors = hint(outputJsonPretty);
    writeFileSync("/tmp/test.json", outputJsonPretty);
    if (errors.length > 0) console.log(errors);
    expect(errors.length).toBe(0);
    expect(inputJson.features.length).toBe(outputJson.features.length);
  });
});

describe("DCELtoGeoJSON creates a valid geoJSON of simple shapes", function () {
  const dir = "assets/data/shapes";
  const testFiles = getTestFiles(dir);

  testFiles.forEach((file) => {
    it("based on a DCEL of " + file, function () {
      const inputJson = JSON.parse(readFileSync(resolve(dir + "/" + file), "utf8"));
      const dcel = Dcel.fromGeoJSON(inputJson);
      const dcelC = new DcelConverter(dcel);
      const outputJson = dcelC.toGeoJSON(file);
      const outputJsonPretty = JSON.stringify(outputJson, null, 4);
      const errors = hint(outputJsonPretty);
      if (errors.length > 0) console.log(errors);
      expect(errors.length).toBe(0);
      expect(inputJson.features.length).toBe(outputJson.features.length);
    });
  });
});

describe("DCELtoGeoJSON creates a valid geoJSON of geodata", function () {
  const dir = "assets/data/geodata";
  const testFiles = getTestFiles(dir);

  testFiles.forEach((file) => {
    it("based on a DCEL of " + file, function () {
      const inputJson = JSON.parse(readFileSync(resolve(dir + "/" + file), "utf8"));
      const dcel = Dcel.fromGeoJSON(inputJson);
      const dcelC = new DcelConverter(dcel);
      const outputJson = dcelC.toGeoJSON(file);
      const outputJsonPretty = JSON.stringify(outputJson, null, 4);
      const errors = hint(outputJsonPretty);
      // writeFileSync("/tmp/test" + file, outputJsonPretty);
      if (errors.length > 0) console.log(errors);
      expect(errors.length).toBe(0);
      expect(inputJson.features.length).toBe(outputJson.features.length);
    });
  });
});
