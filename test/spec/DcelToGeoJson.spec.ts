import fs from "fs";
import path from "path";
import { getTestFiles } from "./test-setup";
import Dcel from "@/src/Dcel/Dcel";

xdescribe("toSubdivision creates a valid Subdivision of a square with a hole", function () {
  it("despite converting it to a multipolygon, the number of outer and inner rings stays the same.", function () {
    const squareOriginal = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/square-hole.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(squareOriginal);
    const squareGenerated = dcel.toSubdivision();

    //TODO: implement with Subdivision
    expect(squareGenerated).toBeDefined();
    // const featureNew = squareGenerated.features[0]
    //   .geometry as GeoJSON.MultiPolygon;

    // expect(featureNew.coordinates.length).toBe(1);
    // expect(featureNew.coordinates[0].length).toBe(2);
    // expect(featureNew.coordinates[0][0].length).toBe(5);
    // expect(featureNew.coordinates[0][1].length).toBe(5);
  });
});

xdescribe("toSubdivision creates a valid subdivision of simple shapes", function () {
  const dir = "test/data/shapes";
  const testFiles = getTestFiles(dir);

  testFiles.forEach((file) => {
    xit("based on a DCEL of " + file, function () {
      const inputJson = JSON.parse(
        fs.readFileSync(path.resolve(dir + "/" + file), "utf8"),
      );
      const dcel = Dcel.fromGeoJSON(inputJson);

      // TODO: implement with Subdivision
      expect(dcel.toSubdivision()).toBeDefined();
      // const outputJson = dcel.toGeoJSON();
      // const outputJsonPretty = JSON.stringify(outputJson, null, 4);
      // const errors = hint(outputJsonPretty);
      // expect(errors.length).toBe(0);
      // expect(inputJson.features.length).toBe(outputJson.features.length);
    });
  });
});

describe("toSubdivision creates a valid subdivision of (simplified) geodata", function () {
  const testFile = "test/data/geodata/AUT_adm0-s0_5.json";

  it(
    "based on a DCEL of " + testFile.slice(0, testFile.lastIndexOf("/")),
    function () {
      const inputJson = JSON.parse(
        fs.readFileSync(path.resolve(testFile), "utf8"),
      );
      const dcel = Dcel.fromGeoJSON(inputJson);

      //TODO: implement with Subdivision
      expect(dcel.toSubdivision()).toBeDefined();
      // const outputJson = dcel.toGeoJSON();
      // const outputJsonPretty = JSON.stringify(outputJson, null, 4);
      // const errors = hint(outputJsonPretty);
      // expect(errors.length).toBe(0);
      // expect(inputJson.features.length).toBe(outputJson.features.length);
    },
  );
});
