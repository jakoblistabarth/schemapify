import fs from "fs";
import path from "path";
import { hint } from "@mapbox/geojsonhint";
import { getTestFiles } from "./test-setup";
import Dcel from "../assets/lib/Dcel/Dcel";
import Face from "../assets/lib/Dcel/Face";

describe("A Dcel of 2 adjacent squares", function () {
  const json = JSON.parse(
    fs.readFileSync(path.resolve("assets/data/shapes/2plgn-adjacent.json"), "utf8")
  );
  const dcel = Dcel.fromGeoJSON(json);

  it("has 1 unbounded face", function () {
    expect(dcel.getUnboundedFace()).toEqual(jasmine.any(Object));
  });

  it("has 3 faces", function () {
    expect(dcel.faces.length).toBe(3);
  });

  it("has 6 vertices", function () {
    expect(dcel.vertices.size).toBe(6);
  });

  it("has 14 edges", function () {
    expect(dcel.halfEdges.size).toBe(14);
  });

  it("has inner faces with the right amount of edges", function () {
    const edgeCount = dcel.getBoundedFaces().reduce((counter: number[], f: Face) => {
      counter.push(f.getEdges().length);
      return counter;
    }, []);
    expect(edgeCount.sort()).toEqual([4, 4].sort());
  });
});

describe("A Dcel of 3 adjacent squares", function () {
  const json = JSON.parse(fs.readFileSync(path.resolve("assets/data/shapes/3plgn.json"), "utf8"));
  const dcel = Dcel.fromGeoJSON(json);

  it("has 1 unbounded face", function () {
    expect(dcel.getUnboundedFace()).toEqual(jasmine.any(Object));
  });

  it("has 4 faces", function () {
    expect(dcel.faces.length).toBe(4);
  });

  it("has 8 vertices", function () {
    expect(dcel.vertices.size).toBe(8);
  });

  it("has 20 edges", function () {
    expect(dcel.halfEdges.size).toBe(20);
  });

  it("has inner faces with the right amount of edges", function () {
    const edgeCount = dcel.getBoundedFaces().reduce((counter: number[], f: Face) => {
      counter.push(f.getEdges().length);
      return counter;
    }, []);
    expect(edgeCount.sort()).toEqual([4, 4, 4]);
  });
});

describe("getBbox()", function () {
  it("returns the correct boundingbox of a given dcel", function () {
    const plgn1 = JSON.parse(
      fs.readFileSync(path.resolve("assets/data/shapes/square.json"), "utf8")
    );
    const plgn2 = JSON.parse(
      fs.readFileSync(path.resolve("assets/data/shapes/2plgn-adjacent.json"), "utf8")
    );
    const plgn3 = JSON.parse(
      fs.readFileSync(path.resolve("assets/data/shapes/3plgn.json"), "utf8")
    );

    let bboxPlgn1 = Dcel.fromGeoJSON(plgn1).getBbox();
    let bboxPlgn2 = Dcel.fromGeoJSON(plgn2).getBbox();
    let bboxPlgn3 = Dcel.fromGeoJSON(plgn3).getBbox();

    expect(bboxPlgn1).toEqual([0, 0, 2, 2]);
    expect(bboxPlgn2).toEqual([0, 0, 4, 2]);
    expect(bboxPlgn3).toEqual([0, 0, 2, 2]);
  });
});

describe("getVertices()", function () {
  let dcel: Dcel;

  beforeEach(function () {
    const polygon = JSON.parse(
      fs.readFileSync(path.resolve("assets/data/shapes/square.json"), "utf8")
    );
    dcel = Dcel.fromGeoJSON(polygon);
    dcel.preProcess();
    dcel.classify();
  });

  it("returns vertices of type insignificant if specified", function () {
    expect(dcel.getVertices(false).every((v) => !v.significant)).toBeTruthy();
  });
  it("returns vertices of type significant if specified", function () {
    expect(dcel.getVertices(true).every((v) => v.significant)).toBeTruthy();
  });
  it("returns all vertices if no type specified", function () {
    expect(dcel.getVertices().length).toBe([...dcel.vertices].length);
  });
});

describe("getDiameter()", function () {
  it("returns the correct diameter", function () {
    const plgn1 = JSON.parse(
      fs.readFileSync(path.resolve("assets/data/shapes/square.json"), "utf8")
    );
    const plgn3 = JSON.parse(
      fs.readFileSync(path.resolve("assets/data/shapes/3plgn.json"), "utf8")
    );

    expect(Dcel.fromGeoJSON(plgn1).getDiameter()).toBe(Math.sqrt(Math.pow(2, 2) + Math.pow(2, 2)));
    expect(Dcel.fromGeoJSON(plgn3).getDiameter()).toBe(Math.sqrt(Math.pow(2, 2) + Math.pow(2, 2)));
  });
});

describe("classify() returns a result which can be turned into a valid geojson", function () {
  const dir = "assets/data/shapes";
  const testFiles = getTestFiles(dir);

  testFiles.forEach((file) => {
    it("for the simple input " + file, function () {
      const inputJson = JSON.parse(fs.readFileSync(path.resolve(dir + "/" + file), "utf8"));
      const dcel = Dcel.fromGeoJSON(inputJson);
      dcel.preProcess();
      dcel.classify();
      const outputJson = dcel.toGeoJSON();
      const outputJsonPretty = JSON.stringify(outputJson, null, 4);
      const errors = hint(outputJsonPretty);
      if (errors.length > 0) console.log(errors);
      expect(errors.length).toBe(0);
      expect(inputJson.features.length).toBe(outputJson.features.length);
    });
  });
});

describe("classify() returns a result which can be turned into a valid geojson", function () {
  const dir = "assets/data/geodata";
  const testFiles = getTestFiles(dir);

  testFiles.forEach((file) => {
    it("for the geodata input " + file, function () {
      const inputJson = JSON.parse(fs.readFileSync(path.resolve(dir + "/" + file), "utf8"));
      const dcel = Dcel.fromGeoJSON(inputJson);
      dcel.preProcess();
      dcel.classify();
      const outputJson = dcel.toGeoJSON();
      const outputJsonPretty = JSON.stringify(outputJson, null, 4);
      const errors = hint(outputJsonPretty);
      if (errors.length > 0) console.log(errors);
      expect(errors.length).toBe(0);
      expect(inputJson.features.length).toBe(outputJson.features.length);
    });
  });
});

describe("schematize() returns a result which can be turned into a valid geojson", function () {
  const dir = "assets/data/geodata";
  const testFiles = getTestFiles(dir);

  testFiles.forEach((file) => {
    if (file === "ne_110m_admin_0_countries.json" || file === "AUT_adm1.json") return; //TODO: test other geodata as well?
    it("for the geodata input " + file, function () {
      const inputJson = JSON.parse(fs.readFileSync(path.resolve(dir + "/" + file), "utf8"));
      const dcel = Dcel.fromGeoJSON(inputJson);
      dcel.schematize();
      const outputJson = dcel.toGeoJSON();
      const outputJsonPretty = JSON.stringify(outputJson, null, 4);
      const errors = hint(outputJsonPretty);
      if (errors.length > 0) console.log(errors);
      expect(errors.length).toBe(0);
      expect(inputJson.features.length).toBe(outputJson.features.length);
    });
  });
});

describe("schematize() returns a result which can be turned into a valid geojson", function () {
  const dir = "assets/data/shapes";
  const testFiles = getTestFiles(dir);

  testFiles.forEach((file) => {
    it("for the simple input " + file, function () {
      const inputJson = JSON.parse(fs.readFileSync(path.resolve(dir + "/" + file), "utf8"));
      const dcel = Dcel.fromGeoJSON(inputJson);
      dcel.schematize();
      const outputJson = dcel.toGeoJSON();
      const outputJsonPretty = JSON.stringify(outputJson, null, 4);
      const errors = hint(outputJsonPretty);
      if (errors.length > 0) console.log(errors);
      expect(errors.length).toBe(0);
      expect(inputJson.features.length).toBe(outputJson.features.length);
    });
  });
});
