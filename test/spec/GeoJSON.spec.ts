import fs from "fs";
import path from "path";
import { getTestFiles } from "./test-setup";
import { scavenge } from "@placemarkio/check-geojson";
import Dcel from "@/src/Dcel/Dcel";
import { featureReduce } from "@turf/meta";
import booleanValid from "@turf/boolean-valid";

describe("validate geoJSON file (simple shape)", function () {
  const dir = "test/data/shapes";
  const testFiles = getTestFiles(dir);

  testFiles.forEach((file) => {
    it(file + " to return 0 errors, e.i., to be valid", function () {
      const json = JSON.parse(
        fs.readFileSync(path.resolve(dir + "/" + file), "utf8"),
      );

      const { rejected } = scavenge(JSON.stringify(json, null, 4));
      expect(rejected.length).toBe(0);
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
      const { rejected } = scavenge(JSON.stringify(json, null, 4));
      expect(rejected.length).toBe(0);
    });
  });
});

describe("Find errors for invalid geoJSON file", function () {
  it("with a unclosed polygon", function () {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/invalid/not-closed.json"),
        "utf8",
      ),
    );
    const { rejected } = scavenge(JSON.stringify(json, null, 4));
    expect(rejected.length).toBeGreaterThan(0);
  });

  it("with a polygon using invalid structure (lowercase 'polygon')member", function () {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve(
          "test/data/invalid/square-invalid-member-lowercase-polygon.json",
        ),
        "utf8",
      ),
    );
    const { rejected } = scavenge(JSON.stringify(json, null, 4));
    expect(rejected.length).toBeGreaterThan(0);
  });

  // use turf for validation with advanced geometry-checks
  it("with a polygon containing a loop edge", function () {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/invalid/square-loop-edge.json"),
        "utf8",
      ),
    );
    const isValid = featureReduce(
      json,
      (_, feature) => (booleanValid(feature) ? true : false),
      true,
    );
    expect(isValid).toBe(false);
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
    expect(() => Dcel.fromGeoJSON(json)).toThrow("invalid input");
  });
});
