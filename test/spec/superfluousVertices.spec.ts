import Dcel from "@/src/Dcel/Dcel";
import CSchematization from "@/src/c-oriented-schematization/CSchematization";
import Subdivision from "@/src/geometry/Subdivision";
import { readFileSync } from "fs";
import path from "path";

describe("removeSuperfluousVertices()", function () {
  it("on a triangle-shaped DCEL of with superfluous vertices, results in a DCEL of 3 vertices", function () {
    const json = JSON.parse(
      readFileSync(
        path.resolve("test/data/shapes/superfluous-vertices-triangle.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    const schematization = new CSchematization();
    schematization.removeSuperfluousVertices(dcel);

    expect(dcel.getVertices().length).toBe(3);
  });

  it("on a square-shaped DCEL of with superfluous vertices, results in a DCEL of 4 vertices", function () {
    const json = JSON.parse(
      readFileSync(
        path.resolve("test/data/shapes/superfluous-vertices-square.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    const schematization = new CSchematization();
    schematization.removeSuperfluousVertices(dcel);

    expect(dcel.getVertices().length).toBe(4);
  });

  it("removes 3 collinear points", function () {
    const json = JSON.parse(
      readFileSync(path.resolve("test/data/shapes/square.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel.getBoundedFaces()[0].getEdges()[0].subdivide();

    const schematization = new CSchematization();
    schematization.removeSuperfluousVertices(dcel);

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

    const schematization = new CSchematization();
    schematization.removeSuperfluousVertices(dcel);

    expect(dcel.getBoundedFaces()[0].getEdges().length).toBe(4);
    expect(dcel.getHalfEdges().length).toBe(8);
    expect(dcel.getVertices().length).toBe(4);
  });

  it("removes any collinear points on a simples square", function () {
    const dcel = Dcel.fromSubdivision(
      Subdivision.fromCoordinates([
        [
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
        ],
      ]),
    );

    const schematization = new CSchematization();
    schematization.removeSuperfluousVertices(dcel);

    expect(dcel.getVertices().length).toBe(4);
    expect(dcel.getHalfEdges().length).toBe(8);
    expect(dcel.getBoundedFaces()[0].getEdges().length).toBe(4);
  });
});
