import MultiPolygon from "@/src/geometry/MultiPolygon";
import Polygon from "@/src/geometry/Polygon";
import { geoJsonToGeometry } from "@/src/utilities";
import fs from "fs";
import path from "path";

describe("geojsonToGeometry parses a geojson feature collection of Austria into a geometry", function () {
  let geometry: MultiPolygon[];

  beforeEach(function () {
    const geojson = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/geodata/AUT_adm1-simple.json"),
        "utf8",
      ),
    );
    geometry = geoJsonToGeometry(geojson);
  });

  it("with 9 multipolygons", function () {
    expect(geometry.length).toBe(9);
  });

  it("with the first multipolygon (Burgenland), being a Polygon, with a single ring with 3 vertices", function () {
    const burgenland = geometry[0];
    expect(burgenland.polygons.length).toBe(1);
    expect(burgenland.polygons[0].rings.length).toBe(1);
    expect(burgenland.polygons[0].rings[0].length).toBe(3);
  });

  it("with the 3rd multipolygon (Lower Austria) consisting of 1 polygon, with a hole", function () {
    const lowerAustria = geometry[2];
    expect(lowerAustria.polygons.length).toBe(1);
    expect(lowerAustria.polygons[0].rings.length).toBe(2);
  });

  it("with the 7th multipolygon (Tyrol) consisting of 2 polygons", function () {
    const tyrol = geometry[6];
    expect(tyrol.polygons.length).toBe(2);
    expect(tyrol.polygons[0].rings[0].length).toBe(3);
    expect(tyrol.polygons[1].rings[0].length).toBe(4);
  });

  it("with only counterclockwise ordered Rings", function () {
    const rings = geometry
      .map((multipolygons) =>
        multipolygons.polygons.map((polygon) => polygon.rings),
      )
      .flat(2);
    expect(
      rings.every((r) => {
        if (r.isClockwise) console.log(r.points);
        return !r.isClockwise;
      }),
    ).toBeTruthy();
  });
});

describe("geojsonToGeometry parses a geojson feature collection of a simple enclave into a geometry", function () {
  let geometry: MultiPolygon[];

  beforeEach(function () {
    const geojson = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/enclave.json"), "utf8"),
    );
    geometry = geoJsonToGeometry(geojson);
  });

  it("with 2 multipolygons", function () {
    // console.log(
    //   geometry
    //     .map((multipolygons) =>
    //       multipolygons.polygons.map((polygon) =>
    //         polygon.rings.map((ring) => ring.points.map((p) => p.xy())),
    //       ),
    //     )
    //     .flat(3),
    // );
    expect(geometry.length).toBe(2);
  });

  it("with the correctly ordered rings", function () {
    expect(geometry[0].polygons[0]).toEqual(
      Polygon.fromCoordinates([
        [
          [0, 0],
          [2, 0],
          [2, 2],
          [0, 2],
        ],
        [
          [0.5, 0.5],
          [1.5, 0.5],
          [1.5, 1.5],
          [0.5, 1.5],
        ],
      ]),
    );
  });
});
