import { readFileSync } from "fs";
import { resolve } from "path";
import { getTestFiles } from "./test-helpers.mjs";
import { hint } from "@mapbox/geojsonhint";

describe("validate geoJSON file (simple shape)", function () {
  const dir = "assets/data/shapes";
  const testFiles = getTestFiles(dir);

  testFiles.forEach((file) => {
    it(file + " to return 0 errors, e.i. to be valid", function () {
      const json = JSON.parse(readFileSync(resolve(dir + "/" + file), "utf8"));
      const errors = hint(JSON.stringify(json, null, 4));
      if (errors.length > 0) console.log(errors);
      expect(errors.length).toBe(0);
    });
  });
});

describe("validate geoJSON file (geodata)", function () {
  const dir = "assets/data/geodata";
  const testFiles = getTestFiles(dir);

  testFiles.forEach((file) => {
    it(file + " to return 0 errors, e.i. to be valid", function () {
      const json = JSON.parse(readFileSync(resolve(dir + "/" + file), "utf8"));
      const errors = hint(JSON.stringify(json, null, 4));
      if (errors.length > 0) console.log(errors);
      expect(errors.length).toBe(0);
    });
  });
});
