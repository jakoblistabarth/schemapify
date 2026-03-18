import { readFileSync } from "fs";
import path from "path";
import Dcel from "@/src/Dcel/Dcel";
import Face from "@/src/Dcel/Face";
import type { GeoJsonProperties, MultiPolygon } from "geojson";
import CSchematization from "@/src/c-oriented-schematization/CSchematization";
import { beforeAll, describe, expect, test } from "vitest";

describe("2-a. The system shall be able to parse geoJSON as input data.", function () {
  const json = JSON.parse(
    readFileSync(
      path.resolve("test/data/geodata/ne_50m_europe_mapunits-s20.json"),
      "utf8",
    ),
  );

  test("Parses a json object", function () {
    expect(() => Dcel.fromGeoJSON(json)).not.toThrow();
  });
});

describe("3-a. If the input data is not a region i.e., it contains features of type other than polygon or multipolygon – the program shall exit and the user shall be informed.", function () {
  test("An error is thrown for a file containing geometry of type 'LineString'.", function () {
    const json = JSON.parse(
      readFileSync(path.resolve("test/data/invalid/linestrings.json"), "utf8"),
    );
    expect(() => Dcel.fromGeoJSON(json)).toThrow("invalid input");
  });
});

// TODO: get new geojson parsing library. needs to be commented out because not compatible with testing gui
describe("4-a. If the input data is not a valid geoJSON the program shall exit and the user shall be informed.", function () {
  test.fails(
    "An error is thrown for a file containing polygons which are not closed.",
    function () {
      const json = JSON.parse(
        readFileSync(path.resolve("test/data/invalid/not-closed.json"), "utf8"),
      );
      expect(() => Dcel.fromGeoJSON(json)).toThrow("invalid input");
    },
  );

  test.fails(
    "An error is thrown for a file containing geometry with a loop edge (same start end endpoint).",
    function () {
      const json = JSON.parse(
        readFileSync(
          path.resolve("test/data/invalid/square-loop-edge.json"),
          "utf8",
        ),
      );
      expect(() => Dcel.fromGeoJSON(json)).toThrow("invalid input");
    },
  );

  test.fails(
    "An error is thrown for a file containing geometry which violates the geoJSON specification's 'right-hand rule'.",
    function () {
      const json = JSON.parse(
        readFileSync(
          path.resolve(
            "test/data/invalid/square-right-hand-rule-violation.json",
          ),
          "utf8",
        ),
      );
      expect(() => Dcel.fromGeoJSON(json)).toThrow("invalid input");
    },
  );
});

describe("5-a. If the input data is too detailed, i.e., if it exceeds a maximum number of edges or vertices, the program shall exit and the user shall be informed.", function () {
  const json = JSON.parse(
    readFileSync(path.resolve("test/data/geodata/AUT_adm1.json"), "utf8"),
  );

  test("An error is thrown when the region exceeds the total number of 5,000 edges.", function () {
    expect(() => Dcel.fromGeoJSON(json)).toThrow("invalid input");
  });
});

describe("Output and transformation with .run() (10s timeout)", () => {
  let input: GeoJSON.FeatureCollection<MultiPolygon>;
  let inputProperties: GeoJsonProperties[];
  let output: Dcel;
  let outputProperties: (GeoJsonProperties | undefined)[];

  beforeAll(() => {
    input = JSON.parse(
      readFileSync(
        path.resolve("test/data/geodata/AUT_adm1-simple.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(input);
    const schematization = new CSchematization();
    schematization.run(dcel);
    output = dcel;
    inputProperties = input.features.map((f: GeoJSON.Feature) => f.properties);
    outputProperties = output
      .toSubdivision()
      .multiPolygons.map((f) => f.properties);
  }, 20_000);

  describe("6-a. If the input data holds attributes attached to its features, the systems shall preserve these attributes in the output.", function () {
    test("The number of feature properties needs to be the same for the input and the output.", function () {
      expect(inputProperties.length).toEqual(outputProperties.length);
    });

    test("The properties of a certain feature needs to be the same for the input and the output.", function () {
      expect(inputProperties[3]).toEqual(outputProperties[3]);
    });
  });

  describe("7-a. The system shall preserve the number of features of the input in the output.", function () {
    test("The number of features needs to be the same for the input and the output.", function () {
      const inputFeatures = input.features.length;
      const outputFeatures = output.toSubdivision().multiPolygons.length;
      expect(inputFeatures).toEqual(outputFeatures);
    });
  });
});

describe("8-a The system shall be able to generate a DCEL from a geoJSON.", function () {
  let dcel: Dcel;
  beforeAll(() => {
    const input = JSON.parse(
      readFileSync(
        path.resolve("test/data/geodata/AUT_adm1-simple.json"),
        "utf8",
      ),
    );
    dcel = Dcel.fromGeoJSON(input);
  }, 15_000);

  test("The DCEL has 1 unbounded face", function () {
    expect(dcel.getUnboundedFace()).toBeInstanceOf(Face);
  });

  test("The DCEL has 10 bounded faces", function () {
    expect(dcel.getBoundedFaces().length).toBe(10);
  });
});

describe("9-a. The system shall be able to generate a subdivision from a DCEL.", function () {
  test("Is a valid subdivision.", function () {
    const input = JSON.parse(
      readFileSync(
        path.resolve("test/data/geodata/AUT_adm1-simple.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(input);
    expect(dcel.toSubdivision().multiPolygons.length).toEqual(
      input.features.length,
    );
  });
});
