import fs from "fs";
import path from "path";
import { getTestFiles } from "./test-setup";
//@ts-ignore
import { hint } from "@mapbox/geojsonhint";

describe("validate geoJSON file (simple shape)", function () {
  const dir = "test/data/shapes";
  const testFiles = getTestFiles(dir);

  testFiles.forEach((file) => {
    xit(file + " to return 0 errors, e.i., to be valid", function () {
      const json = JSON.parse(
        fs.readFileSync(path.resolve(dir + "/" + file), "utf8")
      );
      const errors = hint(JSON.stringify(json, null, 4));
      expect(errors.length).toBe(0);
    });
  });
});

describe("validate geoJSON file (geodata)", function () {
  const dir = "test/data/geodata";
  const testFiles = getTestFiles(dir);

  testFiles.forEach((file) => {
    it(file + " to return 0 errors, e.i., to be valid", function () {
      const json = JSON.parse(
        fs.readFileSync(path.resolve(dir + "/" + file), "utf8")
      );
      const errors = hint(JSON.stringify(json, null, 4));
      expect(errors.length).toBe(0);
    });
  });
});

describe("Find errors for invalid geoJSON file (own example)", function () {
  const dir = "test/data/invalid";
  const testFiles = getTestFiles(dir);

  testFiles.forEach((file) => {
    xit(file, function () {
      const json = JSON.parse(
        fs.readFileSync(path.resolve(dir + "/" + file), "utf8")
      );
      const errors = hint(JSON.stringify(json, null, 4));
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
