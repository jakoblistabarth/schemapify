import { readFileSync, readdirSync } from "fs";
import { resolve } from "path";
import DCEL from "../assets/lib/dcel/Dcel.mjs";

describe("buildFromGeoJSON() sets all required properties for all", function () {
  const dir = "assets/data/shapes";

  const filesInDir = readdirSync(dir, function (err, files) {
    //handling error
    if (err) {
      return console.log("Unable to scan directory: " + err);
    }
    //listing all files using forEach
    return files;
  });
  const testFiles = filesInDir.filter((f) => f.substr(-5, f.length) === ".json");

  testFiles.forEach((file) => {
    const json = JSON.parse(readFileSync(resolve(dir + "/" + file), "utf8"));
    let dcel = DCEL.buildFromGeoJSON(json);

    it("vertices", function () {
      const vertices = Object.values(dcel.vertices)
        .map((vertex) => Object.values(vertex).every((x) => typeof x !== "undefined"))
        .every((x) => x === true);
      expect(vertices).toBe(true);
    });

    it("halfEdges", function () {
      const halfEdges = dcel.halfEdges
        .map((halfEdge) => Object.values(halfEdge).every((x) => typeof x !== "undefined"))
        .every((x) => x === true);
      expect(halfEdges).toBe(true);
    });

    it("faces", function () {
      const faces = dcel.faces
        .map((face) => Object.values(face).every((x) => typeof x !== "undefined"))
        .every((x) => x === true);
      expect(faces).toBe(true);
    });
  });
});

describe("A DCEL of 2 adjacent squares", function () {
  const json = JSON.parse(readFileSync(resolve("assets/data/shapes/2plgn-adjacent.json"), "utf8"));
  let dcel = DCEL.buildFromGeoJSON(json);

  it("has 1 outerface", function () {
    expect(dcel.outerFace).toEqual(jasmine.any(Object));
  });

  it("has 3 faces", function () {
    expect(dcel.faces.length).toBe(3);
  });

  it("has 6 vertices", function () {
    expect(Object.keys(dcel.vertices).length).toBe(6);
  });

  it("has 14 edges", function () {
    expect(dcel.halfEdges.length).toBe(14);
  });

  it("has faces with the right amount of edges", function () {
    const edgeCount = dcel.getFaces().reduce((counter, f) => {
      counter.push(f.getEdges().length);
      return counter;
    }, []);
    expect(edgeCount.sort()).toEqual([4, 4, 6].sort());
  });

  it("has outer Face with 6 linked edges", function () {
    expect(dcel.outerFace.getEdges().length).toBe(6);
    expect(dcel.outerFace.edge.twin.face.getEdges().length).toBe(4);
  });
});

describe("A DCEL of 3 adjacent squares", function () {
  const json = JSON.parse(readFileSync(resolve("assets/data/shapes/3plgn.json"), "utf8"));
  let dcel = DCEL.buildFromGeoJSON(json);

  it("has 1 outerface", function () {
    expect(dcel.outerFace).toEqual(jasmine.any(Object));
  });

  it("has 4 faces", function () {
    expect(dcel.faces.length).toBe(4);
  });

  it("has 8 vertices", function () {
    expect(Object.keys(dcel.vertices).length).toBe(8);
  });

  it("has 20 edges", function () {
    expect(dcel.halfEdges.length).toBe(20);
  });

  it("has faces with the right amount of edges", function () {
    const edgeCount = dcel.getFaces().reduce((counter, f) => {
      counter.push(f.getEdges().length);
      return counter;
    }, []);
    expect(edgeCount.sort()).toEqual([4, 4, 4, 8].sort());
  });
});

describe("getBbox()", function () {
  it("returns the correct boundingbox of a given dcel", function () {
    const plgn1 = JSON.parse(readFileSync(resolve("assets/data/shapes/square.json"), "utf8"));
    const plgn2 = JSON.parse(
      readFileSync(resolve("assets/data/shapes/2plgn-adjacent.json"), "utf8")
    );
    const plgn3 = JSON.parse(readFileSync(resolve("assets/data/shapes/3plgn.json"), "utf8"));

    let bboxPlgn1 = DCEL.buildFromGeoJSON(plgn1).getBbox();
    let bboxPlgn2 = DCEL.buildFromGeoJSON(plgn2).getBbox();
    let bboxPlgn3 = DCEL.buildFromGeoJSON(plgn3).getBbox();

    expect(bboxPlgn1).toEqual([0, 0, 2, 2]);
    expect(bboxPlgn2).toEqual([0, 0, 4, 2]);
    expect(bboxPlgn3).toEqual([0, 0, 2, 2]);
  });
});

describe("getDiameter()", function () {
  it("returns the correct diameter", function () {
    const plgn1 = JSON.parse(readFileSync(resolve("assets/data/shapes/square.json"), "utf8"));
    const plgn3 = JSON.parse(readFileSync(resolve("assets/data/shapes/3plgn.json"), "utf8"));

    expect(DCEL.buildFromGeoJSON(plgn1).getDiameter()).toEqual(2);
    expect(DCEL.buildFromGeoJSON(plgn3).getDiameter()).toEqual(2);
  });
});
