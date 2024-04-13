import Dcel from "@/src/DCEL/Dcel";
import CSchematization from "@/src/c-oriented-schematization/CSchematization";
import MultiPolygon from "@/src/geometry/MultiPolygon";
import { readFileSync } from "fs";
import path from "path";

describe("removeSuperfluousVertices()", function () {
  it("should remove superfluous vertices", function () {});

  it("removes 3 collinear points", function () {
    const json = JSON.parse(
      readFileSync(path.resolve("test/data/shapes/square.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel.getBoundedFaces()[0].getEdges()[0].subdivide();

    const schematization = new CSchematization(dcel);
    schematization.removeSuperfluousVertices();

    expect(dcel.getBoundedFaces()[0].getEdges().length).toBe(4);
    expect(dcel.getHalfEdges().length).toBe(8);
    expect(dcel.getVertices().length).toBe(4);
  });

  it("removes 4 collinear points", function () {
    const json = JSON.parse(
      readFileSync(path.resolve("test/data/shapes/square.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel.getBoundedFaces()[0].getEdges()[0].subdivide()?.subdivide();

    const schematization = new CSchematization(dcel);
    schematization.removeSuperfluousVertices();

    expect(dcel.getBoundedFaces()[0].getEdges().length).toBe(4);
    expect(dcel.getHalfEdges().length).toBe(8);
    expect(dcel.getVertices().length).toBe(4);
  });

  it("removes any collinear points on a simples square", function () {
    const dcel = Dcel.fromMultiPolygons([
      MultiPolygon.fromCoordinates([
        [
          [
            [-2, -2],
            [-1, -2],
            [0, -2],
            [1, -2],
            [2, -2],
            [2, -1.9],
            [2, -1.8],
            [2, -1.7],
            [2, 1.9],
            [2, 2],
            [1.9, 2],
            [0, 2],
            [-1.9, 2],
            [-2, 2],
          ],
        ],
      ]),
    ]);

    const schematization = new CSchematization(dcel);
    schematization.removeSuperfluousVertices();

    expect(dcel.getVertices().length).toBe(4);
    expect(dcel.getHalfEdges().length).toBe(8);
    expect(dcel.getBoundedFaces()[0].getEdges().length).toBe(4);
  });
});
