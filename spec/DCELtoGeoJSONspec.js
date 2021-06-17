const fs = require("fs");
const path = require("path");
const gjh = require("@mapbox/geojsonhint");
const setup = require("./test-setup.js");
const Dcel = require("../dist/cjs/lib/dcel/Dcel.js").default;

describe("DCELtoGeoJSON creates a valid geoJSON of simple shapes", function () {
  const dir = "assets/data/shapes";
  const testFiles = setup.getTestFiles(dir);

  testFiles.forEach((file) => {
    it("based on a DCEL of " + file, function () {
      const inputJson = JSON.parse(fs.readFileSync(path.resolve(dir + "/" + file), "utf8"));
      const dcel = Dcel.fromGeoJSON(inputJson);
      const outputJson = dcel.toGeoJSON(file);
      const outputJsonPretty = JSON.stringify(outputJson, null, 4);
      const errors = gjh.hint(outputJsonPretty);
      if (errors.length > 0) console.log(errors);
      expect(errors.length).toBe(0);
      expect(inputJson.features.length).toBe(outputJson.features.length);
    });
  });
});

describe("DCELtoGeoJSON creates a valid geoJSON of geodata", function () {
  const dir = "assets/data/geodata";
  const testFiles = setup.getTestFiles(dir);

  testFiles.forEach((file) => {
    it("based on a DCEL of " + file, function () {
      const inputJson = JSON.parse(fs.readFileSync(path.resolve(dir + "/" + file), "utf8"));
      const dcel = Dcel.fromGeoJSON(inputJson);
      const outputJson = dcel.toGeoJSON(file);
      const outputJsonPretty = JSON.stringify(outputJson, null, 4);
      const errors = gjh.hint(outputJsonPretty);
      // fs.writeFileSync("/tmp/test" + file, outputJsonPretty);
      if (errors.length > 0) console.log(errors);
      expect(errors.length).toBe(0);
      expect(inputJson.features.length).toBe(outputJson.features.length);
    });
  });
});
