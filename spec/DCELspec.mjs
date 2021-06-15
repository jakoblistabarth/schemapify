import { readFileSync } from "fs";
import { resolve } from "path";
import { getTestFiles } from "./test-helpers.mjs";
import DCEL from "../assets/lib/dcel/Dcel.mjs";
import { hint } from "@mapbox/geojsonhint";
import { SIGNIFICANCE } from "../assets/lib/dcel/Vertex.mjs";

describe("fromGeoJSON() on geodata creates only complete cycles", function () {
  const dir = "assets/data/geodata";
  const testFiles = getTestFiles(dir);

  testFiles.forEach((file) => {
    const json = JSON.parse(readFileSync(resolve(dir + "/" + file), "utf8"));
    const dcel = DCEL.fromGeoJSON(json);

    const cycles = [];
    dcel.getBoundedFaces().forEach((f) => {
      cycles.push(f.getEdges());
      cycles.push(f.getEdges(false));
    });

    it("with complete cycles for all faces in counter-clockwise and clockwise direction", function () {
      expect(cycles).nothing();
    });
  });
});

describe("fromGeoJSON() on simple shapes creates only complete cycles", function () {
  const dir = "assets/data/shapes";
  const testFiles = getTestFiles(dir);

  testFiles.forEach((file) => {
    const json = JSON.parse(readFileSync(resolve(dir + "/" + file), "utf8"));
    const dcel = DCEL.fromGeoJSON(json);

    const cycles = [];
    dcel.getBoundedFaces().forEach((f) => {
      cycles.push(f.getEdges());
      cycles.push(f.getEdges(false));
    });

    it("with complete cycles for all faces in counter-clockwise and clockwise direction", function () {
      expect(cycles).nothing();
    });
  });
});

describe("A DCEL of 2 adjacent squares", function () {
  const json = JSON.parse(readFileSync(resolve("assets/data/shapes/2plgn-adjacent.json"), "utf8"));
  const dcel = DCEL.fromGeoJSON(json);

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
    expect(dcel.halfEdges.length).toBe(14);
  });

  it("has inner faces with the right amount of edges", function () {
    const edgeCount = dcel.getBoundedFaces().reduce((counter, f) => {
      counter.push(f.getEdges().length);
      return counter;
    }, []);
    expect(edgeCount.sort()).toEqual([4, 4].sort());
  });
});

describe("A DCEL of 3 adjacent squares", function () {
  const json = JSON.parse(readFileSync(resolve("assets/data/shapes/3plgn.json"), "utf8"));
  const dcel = DCEL.fromGeoJSON(json);

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
    expect(dcel.halfEdges.length).toBe(20);
  });

  it("has inner faces with the right amount of edges", function () {
    const edgeCount = dcel.getBoundedFaces().reduce((counter, f) => {
      counter.push(f.getEdges().length);
      return counter;
    }, []);
    expect(edgeCount.sort()).toEqual([4, 4, 4]);
  });
});

describe("getBbox()", function () {
  it("returns the correct boundingbox of a given dcel", function () {
    const plgn1 = JSON.parse(readFileSync(resolve("assets/data/shapes/square.json"), "utf8"));
    const plgn2 = JSON.parse(
      readFileSync(resolve("assets/data/shapes/2plgn-adjacent.json"), "utf8")
    );
    const plgn3 = JSON.parse(readFileSync(resolve("assets/data/shapes/3plgn.json"), "utf8"));

    let bboxPlgn1 = DCEL.fromGeoJSON(plgn1).getBbox();
    let bboxPlgn2 = DCEL.fromGeoJSON(plgn2).getBbox();
    let bboxPlgn3 = DCEL.fromGeoJSON(plgn3).getBbox();

    expect(bboxPlgn1).toEqual([0, 0, 2, 2]);
    expect(bboxPlgn2).toEqual([0, 0, 4, 2]);
    expect(bboxPlgn3).toEqual([0, 0, 2, 2]);
  });
});

describe("getVertices()", function () {
  let dcel;

  beforeEach(function () {
    const polygon = JSON.parse(readFileSync(resolve("assets/data/shapes/square.json"), "utf8"));
    dcel = DCEL.fromGeoJSON(polygon);
    dcel.preProcess();
    dcel.classify();
  });

  it("returns vertices of type insignificant if specified", function () {
    expect(
      dcel.getVertices(SIGNIFICANCE.I).every((v) => v.significance === SIGNIFICANCE.I)
    ).toBeTruthy();
  });
  it("returns vertices of type significant if specified", function () {
    expect(
      dcel.getVertices(SIGNIFICANCE.S).every((v) => v.significance === SIGNIFICANCE.S)
    ).toBeTruthy();
  });
  it("returns all vertices if no type specified", function () {
    expect(dcel.getVertices().length).toBe([...dcel.vertices].length);
  });
});

describe("getDiameter()", function () {
  it("returns the correct diameter", function () {
    const plgn1 = JSON.parse(readFileSync(resolve("assets/data/shapes/square.json"), "utf8"));
    const plgn3 = JSON.parse(readFileSync(resolve("assets/data/shapes/3plgn.json"), "utf8"));

    expect(DCEL.fromGeoJSON(plgn1).getDiameter()).toBe(Math.sqrt(Math.pow(2, 2) + Math.pow(2, 2)));
    expect(DCEL.fromGeoJSON(plgn3).getDiameter()).toBe(Math.sqrt(Math.pow(2, 2) + Math.pow(2, 2)));
  });
});

describe("classify() returns a result which can be turned into a valid geojson", function () {
  const dir = "assets/data/shapes";
  const testFiles = getTestFiles(dir);

  testFiles.forEach((file) => {
    it("for the simple input " + file, function () {
      const inputJson = JSON.parse(readFileSync(resolve(dir + "/" + file), "utf8"));
      const dcel = DCEL.fromGeoJSON(inputJson);
      dcel.preProcess();
      dcel.classify();
      const outputJson = dcel.toGeoJSON(file);
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
      const inputJson = JSON.parse(readFileSync(resolve(dir + "/" + file), "utf8"));
      const dcel = DCEL.fromGeoJSON(inputJson);
      dcel.preProcess();
      dcel.classify();
      const outputJson = dcel.toGeoJSON(file);
      const outputJsonPretty = JSON.stringify(outputJson, null, 4);
      const errors = hint(outputJsonPretty);
      if (errors.length > 0) console.log(errors);
      expect(errors.length).toBe(0);
      expect(inputJson.features.length).toBe(outputJson.features.length);
    });
  });
});

xdescribe("schematize() returns a result which can be turned into a valid geojson", function () {
  const dir = "assets/data/geodata";
  const testFiles = getTestFiles(dir);

  testFiles.forEach((file) => {
    it("for the geodata input " + file, function () {
      const inputJson = JSON.parse(readFileSync(resolve(dir + "/" + file), "utf8"));
      const dcel = DCEL.fromGeoJSON(inputJson);
      dcel.schematize();
      const outputJson = dcel.toGeoJSON(file);
      const outputJsonPretty = JSON.stringify(outputJson, null, 4);
      const errors = hint(outputJsonPretty);
      if (errors.length > 0) console.log(errors);
      expect(errors.length).toBe(0);
      expect(inputJson.features.length).toBe(outputJson.features.length);
    });
  });
});

xdescribe("schematize() returns a result which can be turned into a valid geojson", function () {
  const dir = "assets/data/shapes";
  const testFiles = getTestFiles(dir);

  testFiles.forEach((file) => {
    it("for the simple input " + file, function () {
      const inputJson = JSON.parse(readFileSync(resolve(dir + "/" + file), "utf8"));
      const dcel = DCEL.fromGeoJSON(inputJson);
      dcel.schematize();
      const outputJson = dcel.toGeoJSON(file);
      const outputJsonPretty = JSON.stringify(outputJson, null, 4);
      const errors = hint(outputJsonPretty);
      if (errors.length > 0) console.log(errors);
      expect(errors.length).toBe(0);
      expect(inputJson.features.length).toBe(outputJson.features.length);
    });
  });
});
