import fs from "fs";
import path from "path";
import Dcel from "@/src/Dcel/Dcel";
import Subdivision from "@/src/geometry/Subdivision";

const getMultiPolygon = (
  subdivision: Subdivision,
  property: string,
  value: number | string,
) => {
  return subdivision.multiPolygons.find(
    ({ properties }) => properties?.[property] === value,
  );
};

const loadTestFile = (filePath: string) => {
  const fileContent = fs.readFileSync(path.resolve(filePath), "utf8");
  const json = JSON.parse(fileContent);
  const fileName = filePath.slice(
    Array.from(filePath.matchAll(/\//g))?.at(-2)?.index,
  );
  return { json, fileName };
};

describe("toSubdivision converts to a valid subdivision from a DCEL of test case", function () {
  const test = "test/data/shapes/square-hole.json";
  const input = loadTestFile(test);
  const dcel = Dcel.fromGeoJSON(input.json);

  it(`"${input.fileName}".`, function () {
    const subdivision = dcel.toSubdivision();
    const multiPolygons = subdivision.multiPolygons;
    // the subdivision consists of a single MultiPolygon
    const polygons = multiPolygons.at(0)?.polygons;
    const rings = polygons?.at(0)?.rings;

    expect(multiPolygons.length).toBe(1);
    expect(polygons?.length).toBe(1);
    expect(rings?.length).toBe(2);
    expect(rings?.map((d) => d.points.length)).toStrictEqual([4, 4]);
  });
});

describe("toSubdivision converts to a valid subdivision from a DCEL of test case", function () {
  const test = "test/data/geodata/AUT_adm1-simple.json";
  const input = loadTestFile(test);
  const dcel = Dcel.fromGeoJSON(input.json);

  it(`"${input.fileName}".`, function () {
    const subdivision = dcel.toSubdivision();
    const lowerAustria = getMultiPolygon(
      subdivision,
      "NAME_1",
      "Niederösterreich",
    );
    const tyrol = getMultiPolygon(subdivision, "NAME_1", "Tirol");
    const vienna = getMultiPolygon(subdivision, "NAME_1", "Wien");

    expect(subdivision).toBeDefined();
    expect(subdivision.multiPolygons.length).toBe(input.json.features.length);
    expect(lowerAustria?.properties?.NAME_1).toBe("Niederösterreich");
    expect(lowerAustria?.polygons.at(0)?.rings.length).toBe(2);
    expect(lowerAustria?.polygons.length).toBe(1);
    expect(tyrol?.polygons.length).toBe(2);
    expect(vienna?.polygons.length).toBe(1);
  });
});

describe("toSubdivision converts to a valid subdivision from a DCEL of test case", function () {
  const test = "test/data/shapes/edge-cases.json";
  const input = loadTestFile(test);
  const dcel = Dcel.fromGeoJSON(input.json);

  it(`"${input.fileName}".`, function () {
    const subdivision = dcel.toSubdivision();
    const withHole = getMultiPolygon(subdivision, "id", 1);
    const withLakes = getMultiPolygon(subdivision, "id", 2);
    const islands = getMultiPolygon(subdivision, "id", 3);

    expect(subdivision?.multiPolygons.length).toBe(input.json.features.length);
    expect(withHole?.properties?.edgeCase).toBe("With hole");
    expect(withHole?.polygons.length).toBe(1);
    expect(withHole?.polygons.at(0)?.interiorRings.length).toBe(1);
    expect(withLakes?.properties?.edgeCase).toBe("With lakes");
    expect(withLakes?.polygons.length).toBe(1);
    expect(withLakes?.polygons.at(0)?.interiorRings.length).toBe(2);
    expect(islands?.properties?.edgeCase).toBe("Has island");
    expect(islands?.polygons.length).toBe(2);
  });
});

describe("toSubdivision converts to a valid subdivision from a DCEL of test case", function () {
  const test = "test/data/shapes/2plgn-islands-holes.json";
  const input = loadTestFile(test);
  const dcel = Dcel.fromGeoJSON(input.json);

  it(`"${input.fileName}".`, function () {
    const subdivision = dcel.toSubdivision();
    const multiPolygon = getMultiPolygon(subdivision, "id", 1);

    expect(subdivision?.multiPolygons.length).toBe(input.json.features.length);
    expect(multiPolygon?.properties?.id).toBe(1);
    expect(multiPolygon?.polygons.length).toBe(3);
    expect(multiPolygon?.polygons.at(0)?.interiorRings.length).toBe(3);
  });
});

describe("toSubdivision converts to a valid subdivision from a DCEL of test case", function () {
  const test = "test/data/shapes/square-3-nested-islands.json";
  const input = loadTestFile(test);
  const dcel = Dcel.fromGeoJSON(input.json);

  it(`"${input.fileName}".`, function () {
    const subdivision = dcel.toSubdivision();
    const multiPolygon = getMultiPolygon(subdivision, "id", 1);

    expect(subdivision?.multiPolygons.length).toBe(input.json.features.length);
    expect(multiPolygon?.properties?.id).toBe(1);
    expect(multiPolygon?.polygons.length).toBe(3);
    expect(multiPolygon?.polygons.at(0)?.interiorRings.length).toBe(1);
    expect(multiPolygon?.polygons.at(1)?.interiorRings.length).toBe(1);
    expect(multiPolygon?.polygons.at(2)?.interiorRings.length).toBe(1);
  });
});
