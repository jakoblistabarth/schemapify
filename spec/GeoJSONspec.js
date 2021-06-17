const fs = require("fs");
const path = require("path");
const setup = require("./test-setup.js");
const gjh = require("@mapbox/geojsonhint");

describe("validate geoJSON file (simple shape)", function () {
  const dir = "assets/data/shapes";
  const testFiles = setup.getTestFiles(dir);

  testFiles.forEach((file) => {
    it(file + " to return 0 errors, e.i. to be valid", function () {
      const json = JSON.parse(fs.readFileSync(path.resolve(dir + "/" + file), "utf8"));
      const errors = gjh.hint(JSON.stringify(json, null, 4));
      if (errors.length > 0) console.log(errors);
      expect(errors.length).toBe(0);
    });
  });
});

describe("validate geoJSON file (geodata)", function () {
  const dir = "assets/data/geodata";
  const testFiles = setup.getTestFiles(dir);

  testFiles.forEach((file) => {
    it(file + " to return 0 errors, e.i. to be valid", function () {
      const json = JSON.parse(fs.readFileSync(path.resolve(dir + "/" + file), "utf8"));
      const errors = gjh.hint(JSON.stringify(json, null, 4));
      if (errors.length > 0) console.log(errors);
      expect(errors.length).toBe(0);
    });
  });
});
