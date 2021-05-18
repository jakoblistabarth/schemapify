import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { getTestFiles } from "./test-helpers.mjs";
import { DCELtoGeoJSON } from "../assets/lib/dcel/DCELtoGeoJSON.mjs";
import { hint } from "@mapbox/geojsonhint";
import DCEL from "../assets/lib/dcel/Dcel.mjs";

describe("DCELtoGeoJSON creates a valid geoJSON", function () {
  it("of 2plgn-islands-holes", function () {
    const json = JSON.parse(
      readFileSync(resolve("assets/data/shapes/2plgn-islands-hole.json"), "utf8")
    );
    const dcel = DCEL.buildFromGeoJSON(json);
    const geoJSON = JSON.stringify(DCELtoGeoJSON(dcel, "2plgn-islands-holes", null, 4));
    const errors = hint(geoJSON);
    // writeFileSync("/tmp/test.json", geoJSON);
    if (errors.length > 0) console.log(errors);
    expect(errors.length).toBe(0);
  });
});

describe("DCELtoGeoJSON creates a valid geoJSON of simple shapes", function () {
  const dir = "assets/data/shapes";
  const testFiles = getTestFiles(dir);

  testFiles.forEach((file) => {
    it("based on a DCEL of" + file, function () {
      const json = JSON.parse(readFileSync(resolve(dir + "/" + file), "utf8"));
      const dcel = DCEL.buildFromGeoJSON(json);
      const geoJSON = JSON.stringify(DCELtoGeoJSON(dcel, "2plgn-islands-holes", null, 4));
      const errors = hint(geoJSON);
      if (errors.length > 0) console.log(errors);
      expect(errors.length).toBe(0);
    });
  });
});

describe("DCELtoGeoJSON creates a valid geoJSON of geodata", function () {
  const dir = "assets/data/geodata";
  const testFiles = getTestFiles(dir);

  testFiles.forEach((file) => {
    it("based on a DCEL of" + file, function () {
      const json = JSON.parse(readFileSync(resolve(dir + "/" + file), "utf8"));
      const dcel = DCEL.buildFromGeoJSON(json);
      const geoJSON = JSON.stringify(DCELtoGeoJSON(dcel, "2plgn-islands-holes", null, 4));
      const errors = hint(geoJSON);
      if (errors.length > 0) console.log(errors);
      expect(errors.length).toBe(0);
    });
  });
});
