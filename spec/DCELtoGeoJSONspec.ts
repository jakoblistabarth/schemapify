import fs from "fs";
import path from "path";
import { hint } from "@mapbox/geojsonhint";
import { getTestFiles } from "./test-setup";
import Dcel from "../src/lib/dcel/Dcel";

describe("DCELtoGeoJSON creates a valid geoJSON of simple shapes", function () {
  const dir = "data/shapes";
  const testFiles = getTestFiles(dir);

  testFiles.forEach((file) => {
    it("based on a DCEL of " + file, function () {
      const inputJson = JSON.parse(fs.readFileSync(path.resolve(dir + "/" + file), "utf8"));
      const dcel = Dcel.fromGeoJSON(inputJson);
      const outputJson = dcel.toGeoJSON();
      const outputJsonPretty = JSON.stringify(outputJson, null, 4);
      const errors = hint(outputJsonPretty);
      if (errors.length > 0) console.log(errors);
      expect(errors.length).toBe(0);
      expect(inputJson.features.length).toBe(outputJson.features.length);
    });
  });
});

describe("DCELtoGeoJSON creates a valid geoJSON of geodata", function () {
  const dir = "data/geodata";
  const testFiles = getTestFiles(dir);

  testFiles.forEach((file) => {
    it("based on a DCEL of " + file, function () {
      const inputJson = JSON.parse(fs.readFileSync(path.resolve(dir + "/" + file), "utf8"));
      const dcel = Dcel.fromGeoJSON(inputJson);
      const outputJson = dcel.toGeoJSON();
      const outputJsonPretty = JSON.stringify(outputJson, null, 4);
      const errors = hint(outputJsonPretty);
      // fs.writeFileSync("/tmp/test" + file, outputJsonPretty);
      if (errors.length > 0) console.log(errors);
      expect(errors.length).toBe(0);
      expect(inputJson.features.length).toBe(outputJson.features.length);
    });
  });
});
