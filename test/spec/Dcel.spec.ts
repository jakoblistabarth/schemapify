import Dcel from "@/src/Dcel/Dcel";
import Face from "@/src/Dcel/Face";
import CSchematization from "@/src/c-oriented-schematization/CSchematization";
import Subdivision from "@/src/geometry/Subdivision";
import fs from "fs";
import * as geojson from "geojson";
import path from "path";
import shape from "../data/geodata/AUT_adm0-s1_epsg31287";
import { getTestFiles } from "./test-setup";

describe("A Dcel from multipolygons", function () {
  it("forming a square is parsed correctly.", function () {
    const s = Subdivision.fromCoordinates([
      [
        [
          [
            [0, 0],
            [2, 0],
            [2, 2],
            [0, 2],
          ],
        ],
      ],
    ]);
    const dcel = Dcel.fromSubdivision(s);

    expect(dcel.faces.length).toBe(2);
    expect(dcel.vertices.size).toBe(4);
    expect(dcel.halfEdges.size).toBe(8);
  });

  it("forming 2 adjacent squares is parsed correctly.", function () {
    const s = Subdivision.fromCoordinates([
      [
        [
          [
            [0, 0],
            [2, 0],
            [2, 2],
            [0, 2],
          ],
        ],
        [
          [
            [2, 0],
            [4, 0],
            [4, 2],
            [2, 2],
          ],
        ],
      ],
    ]);
    const dcel = Dcel.fromSubdivision(s);

    expect(dcel.faces.length).toBe(3);
    expect(dcel.vertices.size).toBe(6);
    expect(dcel.halfEdges.size).toBe(14);
  });

  it("forming 2 separate squares is parsed correctly.", function () {
    const s = Subdivision.fromCoordinates([
      [
        [
          [
            [0, 0],
            [2, 0],
            [2, 2],
            [0, 2],
          ],
        ],
        [
          [
            [3, 0],
            [5, 0],
            [5, 2],
            [3, 2],
          ],
        ],
      ],
    ]);
    const dcel = Dcel.fromSubdivision(s);

    expect(dcel.faces.length).toBe(3);
    expect(dcel.vertices.size).toBe(8);
    expect(dcel.halfEdges.size).toBe(16);
  });

  it("forming 2 separate squares with one hole is parsed correctly.", function () {
    const m = Subdivision.fromCoordinates([
      [
        [
          [
            [0, 0],
            [4, 0],
            [4, 4],
            [0, 4],
          ],
          [
            [1, 1],
            [3, 1],
            [3, 3],
            [1, 3],
          ],
        ],
        [
          [
            [5, 0],
            [9, 0],
            [9, 4],
            [5, 4],
          ],
        ],
      ],
    ]);
    const dcel = Dcel.fromSubdivision(m);

    expect(dcel.faces.length).toBe(4);
    expect(dcel.vertices.size).toBe(12);
    expect(dcel.halfEdges.size).toBe(24);
  });
});

describe("A Dcel from a geojson feature collection of 2 adjacent squares", function () {
  const json = JSON.parse(
    fs.readFileSync(
      path.resolve("test/data/shapes/2plgn-adjacent.json"),
      "utf8",
    ),
  );
  const dcel = Dcel.fromGeoJSON(json);

  it("has 1 unbounded face", function () {
    expect(dcel.getUnboundedFace()).toBeInstanceOf(Face);
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
    const edgeCount = dcel
      .getBoundedFaces()
      .reduce((counter: number[], f: Face) => {
        counter.push(f.getEdges().length);
        return counter;
      }, []);
    expect(edgeCount.sort()).toEqual([4, 4].sort());
  });
});

describe("A Dcel from a geojson feature collection of 3 adjacent squares", function () {
  const json = JSON.parse(
    fs.readFileSync(
      path.resolve("test/data/shapes/3plgn-adjacent.json"),
      "utf8",
    ),
  );
  const dcel = Dcel.fromGeoJSON(json);

  it("has 1 unbounded face", function () {
    expect(dcel.getUnboundedFace()).toBeInstanceOf(Face);
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
    const edgeCount = dcel
      .getBoundedFaces()
      .reduce((counter: number[], f: Face) => {
        counter.push(f.getEdges().length);
        return counter;
      }, []);
    expect(edgeCount.sort()).toEqual([4, 4, 4]);
  });
});

describe("A Dcel from a geojson feature of 3 adjacent squares", function () {
  const json = JSON.parse(
    fs.readFileSync(
      path.resolve("test/data/shapes/3plgn-adjacent.json"),
      "utf8",
    ),
  );
  const dcel = Dcel.fromGeoJSON(json);

  it("has 1 unbounded face", function () {
    expect(dcel.getUnboundedFace()).toBeInstanceOf(Face);
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
    const edgeCount = dcel
      .getBoundedFaces()
      .reduce((counter: number[], f: Face) => {
        counter.push(f.getEdges().length);
        return counter;
      }, []);
    expect(edgeCount.sort()).toEqual([4, 4, 4]);
  });
});

describe("A Dcel fom a geojson feature collection with the simplified boundaries of Austria's states", function () {
  it("can be converted", function () {
    const inputJson = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/geodata/AUT_adm1-simple.json"),
        "utf8",
      ),
    );

    const input: geojson.FeatureCollection<
      geojson.MultiPolygon | geojson.Polygon
    > = {
      type: "FeatureCollection",
      features: [inputJson.features[0], inputJson.features[2]],
    };
    const dcel = Dcel.fromGeoJSON(input);
    expect(dcel).toBeInstanceOf(Dcel);
  });
});

describe("getBbox()", function () {
  it("returns the correct bounding box of a given dcel", function () {
    const plgn1 = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/square.json"), "utf8"),
    );
    const plgn2 = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/2plgn-adjacent.json"),
        "utf8",
      ),
    );
    const plgn3 = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/3plgn-adjacent.json"),
        "utf8",
      ),
    );

    const bboxPlgn1 = Dcel.fromGeoJSON(plgn1).getBbox();
    const bboxPlgn2 = Dcel.fromGeoJSON(plgn2).getBbox();
    const bboxPlgn3 = Dcel.fromGeoJSON(plgn3).getBbox();

    expect(bboxPlgn1.bounds).toEqual([0, 20, 0, 20]);
    expect(bboxPlgn2.bounds).toEqual([0, 4, 0, 2]);
    expect(bboxPlgn3.bounds).toEqual([0, 2, 0, 2]);
  });
});

describe("getVertices()", function () {
  let dcel: Dcel;

  beforeEach(function () {
    const polygon = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/square.json"), "utf8"),
    );
    dcel = Dcel.fromGeoJSON(polygon);
  });

  it("returns all vertices", function () {
    expect(dcel.getVertices().length).toBe(dcel.vertices.size);
  });
});

describe("getDiameter()", function () {
  it("returns the correct diameter", function () {
    const plgn1 = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/square.json"), "utf8"),
    );
    const plgn3 = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/3plgn-adjacent.json"),
        "utf8",
      ),
    );

    expect(Dcel.fromGeoJSON(plgn1).getDiameter()).toBe(
      Math.sqrt(Math.pow(20, 2) + Math.pow(20, 2)),
    );
    expect(Dcel.fromGeoJSON(plgn3).getDiameter()).toBe(
      Math.sqrt(Math.pow(2, 2) + Math.pow(2, 2)),
    );
  });
});

describe("getArea()", function () {
  it("returns the correct area of a square", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/square.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);
    expect(dcel.getArea()).toBe(20 * 20);
  });
  it("returns the correct area of 3 adjacent squares", function () {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/3plgn-adjacent.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    expect(dcel.getArea()).toBe(1 * 1 * 3);
  });

  it("returns the correct area of a square with negative coordinates.", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/square-neg.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);
    expect(dcel.getArea()).toBe(4);
  });

  it("returns the correct area of the enclave test case", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/enclave.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);
    expect(dcel.getArea()).toBe(2 * 2);
  });

  it("returns the correct area for a polygon with 1 hole and 1 island", function () {
    const dcel = Dcel.fromSubdivision(
      Subdivision.fromCoordinates([
        [
          [
            [
              [0, 0],
              [4, 0],
              [4, 4],
              [0, 4],
            ],
            [
              [1, 1],
              [3, 1],
              [3, 3],
              [1, 3],
            ],
          ],
          [
            [
              [1.5, 1.5],
              [2.5, 1.5],
              [2.5, 2.5],
              [1.5, 2.5],
            ],
          ],
        ],
      ]),
    );
    expect(dcel.getArea()).toBe(12 + 1);
  });

  it("returns the correct area for two polygons, one with multiple holes", function () {
    const dcel = Dcel.fromSubdivision(
      Subdivision.fromCoordinates([
        [
          [
            [
              [0, 0],
              [5, 0],
              [5, 5],
              [0, 5],
            ],
            [
              [1, 1],
              [2, 1],
              [2, 2],
              [1, 2],
            ],
            [
              [3, 1],
              [4, 1],
              [4, 2],
              [3, 2],
            ],
            [
              [3, 3],
              [4, 3],
              [4, 4],
              [3, 4],
            ],
            [
              [1, 3],
              [2, 3],
              [2, 4],
              [1, 4],
            ],
          ],
        ],
        [
          [
            [
              [-2, 1],
              [-1, 1],
              [-1, 5],
              [-2, 5],
            ],
          ],
        ],
      ]),
    );
    expect(dcel.getArea()).toBe(21 + 4);
  });

  it("returns the correct area of Austria.", function () {
    const dcel = Dcel.fromSubdivision(new Subdivision([shape]));
    expect(dcel.getArea()).toBeCloseTo(83688201106.428);
  });
});

xdescribe("schematize() returns a result which can be turned into a valid geojson", function () {
  it("for simplified boundaries of Austria.", function () {
    const inputJson = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/geodata/AUT_adm1-simple.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(inputJson);
    const schematization = new CSchematization();
    schematization.run(dcel);
    //TODO: validate schematization
  });
});

xdescribe("run() returns a result which can be turned into a valid geojson", function () {
  const dir = "test/data/shapes";
  const testFiles = getTestFiles(dir);

  testFiles.forEach((file) => {
    // TODO: run specs only on some of the shapes?
    it("for the simple input " + file, function () {
      const inputJson = JSON.parse(
        fs.readFileSync(path.resolve(dir + "/" + file), "utf8"),
      );
      const dcel = Dcel.fromGeoJSON(inputJson);
      const schematization = new CSchematization();
      schematization.run(dcel);
      //TODO: validate schematization
    });
  });
});
