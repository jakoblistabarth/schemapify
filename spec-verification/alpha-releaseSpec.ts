import fs from "fs";
import path from "path";
import { hint } from "@mapbox/geojsonhint";
import Dcel from "../src/lib/DCEL/Dcel";

xdescribe("2-a. The system shall be able to parse geoJSON as input data.", function () {
  const json = JSON.parse(fs.readFileSync(path.resolve("data/shapes/2plgn-adjacent.json"), "utf8"));
  //TODO: use more specific functions?

  it("Parses a json object", function () {
    expect(json).toBeInstanceOf(Object);
  });
});

describe("3-a. If the input data is not a region i.e., it contains features of type other than polygon or multipolygon – the program shall exit and the user shall be informed.", function () {
  it("An error is thrown.", function () {
    const json = JSON.parse(fs.readFileSync(path.resolve("data/invalid/linestrings.json"), "utf8"));
    expect(() => Dcel.fromGeoJSON(json)).toThrowError("invalid input");
  });
});

xdescribe("4-a. If the input data is not a valid geoJSON the program shall exit and the user shall be informed.", function () {
  it("An error is thrown if the right hand side is violated.", function () {
    const json = JSON.parse(fs.readFileSync(path.resolve("data/invalid/square.json"), "utf8"));
    expect(() => Dcel.fromGeoJSON(json)).toThrowError("invalid input");
  });

  it("An error is thrown if a ring is not closed.", function () {
    const json = JSON.parse(fs.readFileSync(path.resolve("data/invalid/not-closed.json"), "utf8"));
    expect(() => Dcel.fromGeoJSON(json)).toThrowError("invalid input");
  });
});

describe("5-a. If the input data is too detailed, i.e., if it exceeds a maximum number of edges or vertices, the program shall exit and the user shall be informed.", function () {
  const json = JSON.parse(fs.readFileSync(path.resolve("data/geodata/AUT_adm1.json"), "utf8"));

  it("An error is thrown when the region exceeds the total number of 5,000 edges.", function () {
    expect(() => Dcel.fromGeoJSON(json)).toThrowError("invalid input");
  });
});

describe("6-a. If the input data holds attributes attached to its features, the systems shall preserve these attributes in the output.", function () {
  const json = JSON.parse(fs.readFileSync(path.resolve("data/geodata/AUT_adm0-s1.json"), "utf8"));
  const dcel = Dcel.fromGeoJSON(json);
  dcel.schematize();
  const output = dcel.toGeoJSON();

  const inputFeatureProperties = json.features.map((f: GeoJSON.Feature) => f.properties);
  const outputFeatureProperties = output.features.map((f) => f.properties);

  it("The number of feature properties needs to be the same for the input and the output.", function () {
    expect(inputFeatureProperties.length).toEqual(outputFeatureProperties.length);
  });

  it("The properties of a certain feature needs to be the same for the input and the output.", function () {
    expect(inputFeatureProperties[3]).toEqual(outputFeatureProperties[3]);
  });
});

describe("7-a. The system shall preserve the number of features of the input in the output.", function () {
  it("The number of features needs to be the same for the input and the output.", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("data/geodata/AUT_adm1-simple.json"), "utf8")
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel.schematize();
    const output = dcel.toGeoJSON();

    const inputFeatures = json.features.length;
    const outputFeatures = output.features.length;

    expect(inputFeatures).toEqual(outputFeatures);
  });
});

describe("8-a The system shall be able to generate a DCEL from a geoJSON.", function () {
  const json = JSON.parse(
    fs.readFileSync(path.resolve("data/geodata/AUT_adm1-simple.json"), "utf8")
  );
  const dcel = Dcel.fromGeoJSON(json);

  it("The DCEL has 1 unbounded face", function () {
    expect(dcel.getUnboundedFace()).toEqual(jasmine.any(Object));
  });

  it("The DCEL has 10 bounded faces", function () {
    expect(dcel.getBoundedFaces().length).toBe(10);
  });
});

describe("9-a. The system shall be able to generate a geoJSON from a DCEL.", function () {
  it("Is a valid geoJSON.", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("data/geodata/AUT_adm1-simple.json"), "utf8")
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel.schematize();
    const output = dcel.toGeoJSON();

    const errors = hint(JSON.stringify(output, null, 4));
    if (errors.length > 0) console.log(errors);
    expect(errors.length).toBe(0);
  });
});

xdescribe("10-a. While the data is being processed, the user shall be informed that the application is processing.", function () {
  it("", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("data/shapes/2plgn-adjacent.json"), "utf8")
    );
  });
});

xdescribe("11-a. The user shall be able to specify a regular set of directions (without β-shift) of the schematization.", function () {
  const json = JSON.parse(fs.readFileSync(path.resolve("data/shapes/2plgn-adjacent.json"), "utf8"));

  it("Creates a valid geoJSON with a rectilinear setup.", function () {});

  it("Creates a valid geoJSON with a hexilinear setup.", function () {});

  it("Creates a valid geoJSON with a octilinear setup.", function () {});
});

xdescribe("17-a. The system shall display the schematized region in the map view after the schematization is finished", function () {
  const json = JSON.parse(fs.readFileSync(path.resolve("data/shapes/2plgn-adjacent.json"), "utf8"));

  it("", function () {});
});

xdescribe("22-a. The user shall be able to track the progress of the schematization.", function () {
  const json = JSON.parse(fs.readFileSync(path.resolve("data/shapes/2plgn-adjacent.json"), "utf8"));

  it("", function () {});
});
