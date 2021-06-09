import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { getTestFiles } from "./test-helpers.mjs";
import Dcel from "../assets/lib/dcel/Dcel.mjs";
import { hint } from "@mapbox/geojsonhint";

describe("DCELtoGeoJSON creates a valid geoJSON of simple shapes", function () {
  const dir = "assets/data/shapes";
  const testFiles = getTestFiles(dir);

  testFiles.forEach((file) => {
    it("based on a DCEL of " + file, function () {
      const inputJson = JSON.parse(readFileSync(resolve(dir + "/" + file), "utf8"));
      const dcel = Dcel.fromGeoJSON(inputJson);
      const outputJson = dcel.toGeoJSON(file);
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
      const outputJson = dcel.toGeoJSON(file);
      const outputJsonPretty = JSON.stringify(outputJson, null, 4);
      const errors = hint(outputJsonPretty);
      // writeFileSync("/tmp/test" + file, outputJsonPretty);
      if (errors.length > 0) console.log(errors);
      expect(errors.length).toBe(0);
      expect(inputJson.features.length).toBe(outputJson.features.length);
    });
  });
});
