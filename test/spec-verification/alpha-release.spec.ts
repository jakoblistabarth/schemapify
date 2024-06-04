import { readFileSync } from "fs";
import path from "path";
import Dcel from "@/src/Dcel/Dcel";
import Face from "@/src/Dcel/Face";
import CSchematization from "@/src/c-oriented-schematization/CSchematization";

describe("2-a. The system shall be able to parse geoJSON as input data.", function () {
  const json = JSON.parse(
    readFileSync(
      path.resolve("test/data/geodata/ne_50m_europe_mapunits-s20.json"),
      "utf8",
    ),
  );

  it("Parses a json object", function () {
    expect(() => Dcel.fromGeoJSON(json)).not.toThrowError();
  });
});

describe("3-a. If the input data is not a region i.e., it contains features of type other than polygon or multipolygon – the program shall exit and the user shall be informed.", function () {
  it("An error is thrown for a file containing geometry of type 'LineString'.", function () {
    const json = JSON.parse(
      readFileSync(path.resolve("test/data/invalid/linestrings.json"), "utf8"),
    );
    expect(() => Dcel.fromGeoJSON(json)).toThrow("invalid input");
  });
});

// TODO: get new geojson parsing library. needs to be commented out because not compatible with testing gui
describe("4-a. If the input data is not a valid geoJSON the program shall exit and the user shall be informed.", function () {
  it.failing(
    "An error is thrown for a file containing polygons which are not closed.",
    function () {
      const json = JSON.parse(
        readFileSync(path.resolve("test/data/invalid/not-closed.json"), "utf8"),
      );
      expect(() => Dcel.fromGeoJSON(json)).toThrow("invalid input");
    },
  );

  it.failing(
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

  it.failing(
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

  it("An error is thrown when the region exceeds the total number of 5,000 edges.", function () {
    expect(() => Dcel.fromGeoJSON(json)).toThrow("invalid input");
  });
});

describe("6-a. If the input data holds attributes attached to its features, the systems shall preserve these attributes in the output.", function () {
  const json = JSON.parse(
    readFileSync(
      path.resolve("test/data/geodata/AUT_adm1-simple.json"),
      "utf8",
    ),
  );
  const dcel = Dcel.fromGeoJSON(json);
  const schematization = new CSchematization();
  schematization.run(dcel);
  const output = dcel.toSubdivision();

  const inputFeatureProperties = json.features.map(
    (f: GeoJSON.Feature) => f.properties,
  );
  const outputFeatureProperties = output.multiPolygons.map((f) => f.properties);

  it("The number of feature properties needs to be the same for the input and the output.", function () {
    expect(inputFeatureProperties.length).toEqual(
      outputFeatureProperties.length,
    );
  });

  it("The properties of a certain feature needs to be the same for the input and the output.", function () {
    expect(inputFeatureProperties[3]).toEqual(outputFeatureProperties[3]);
  });
});

describe("7-a. The system shall preserve the number of features of the input in the output.", function () {
  it("The number of features needs to be the same for the input and the output.", function () {
    const json = JSON.parse(
      readFileSync(
        path.resolve("test/data/geodata/AUT_adm1-simple.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    const schematization = new CSchematization();
    schematization.run(dcel);
    const output = dcel.toSubdivision();

    const inputFeatures = json.features.length;
    const outputFeatures = output.multiPolygons.length;

    expect(inputFeatures).toEqual(outputFeatures);
  });
});

describe("8-a The system shall be able to generate a DCEL from a geoJSON.", function () {
  const json = JSON.parse(
    readFileSync(
      path.resolve("test/data/geodata/AUT_adm1-simple.json"),
      "utf8",
    ),
  );
  const dcel = Dcel.fromGeoJSON(json);

  it("The DCEL has 1 unbounded face", function () {
    expect(dcel.getUnboundedFace()).toBeInstanceOf(Face);
  });

  it("The DCEL has 10 bounded faces", function () {
    expect(dcel.getBoundedFaces().length).toBe(10);
  });
});

describe("9-a. The system shall be able to generate a subdivision from a DCEL.", function () {
  xit("Is a valid subdivision.", function () {
    const json = JSON.parse(
      readFileSync(
        path.resolve("test/data/geodata/AUT_adm1-simple.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    const output = dcel.toSubdivision();

    // TODO: implement validation of Subdivision
    expect(output).toBeDefined();
  });
});
