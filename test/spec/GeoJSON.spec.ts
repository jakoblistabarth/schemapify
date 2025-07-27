import fs from "fs";
import path from "path";
import { getTestFiles } from "./test-setup";
import { hint } from "@mapbox/geojsonhint";
import Dcel from "@/src/Dcel/Dcel";

describe("validate geoJSON file (simple shape)", function () {
  const dir = "test/data/shapes";
  const testFiles = getTestFiles(dir);

  testFiles.forEach((file) => {
    it(file + " to return 0 errors, e.i., to be valid", function () {
      const json = JSON.parse(
        fs.readFileSync(path.resolve(dir + "/" + file), "utf8"),
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
        fs.readFileSync(path.resolve(dir + "/" + file), "utf8"),
      );
      const errors = hint(JSON.stringify(json, null, 4));
      expect(errors.length).toBe(0);
    });
  });
});

// linestrings.json is actually not invalid, by the geojson specification, but it is not supported by the schematization tool (targeting polygons)
describe("Find errors for invalid geoJSON file (own example)", function () {
  const dir = "test/data/invalid";
  const testFiles = getTestFiles(dir).filter((f) => f !== "linestrings.json");

  testFiles.forEach((file) => {
    it(file, function () {
      const json = JSON.parse(
        fs.readFileSync(path.resolve(dir + "/" + file), "utf8"),
      );
      const errors = hint(JSON.stringify(json, null, 4));
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});

describe("If the input data is not a region i.e., it contains features of type other than polygon or multipolygon – the program shall exit and the user shall be informed.", function () {
  it("An error is thrown for a file containing geometry of type 'LineString'.", function () {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/invalid/linestrings.json"),
        "utf8",
      ),
    );
    console.log({ json });
    expect(() => Dcel.fromGeoJSON(json)).toThrow("invalid input");
  });
});
