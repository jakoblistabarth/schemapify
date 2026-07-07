import CollinearPointProcessor from "@/src/c-oriented-schematization/CollinearPointProcessor";
import Dcel from "@/src/Dcel/Dcel";
import { readFileSync } from "fs";
import path from "path";
import { describe, expect, test } from "vitest";

describe("Removing collinear vertices", function () {
  test("on a triangle-shaped DCEL of with colleinar vertices, results in a DCEL of 3 vertices", function () {
    const json = JSON.parse(
      readFileSync(
        path.resolve("test/data/shapes/collinear-vertices-triangle.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    const result = new CollinearPointProcessor().run(dcel);

    expect(result.vertices.size).toBe(3);
  });

  test("on a square-shaped DCEL of with collinear vertices, results in a DCEL of 4 vertices", function () {
    const json = JSON.parse(
      readFileSync(
        path.resolve("test/data/shapes/collinear-vertices-square.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    const result = new CollinearPointProcessor().run(dcel);

    expect(result.vertices.size).toBe(4);
  });

  test("removes 3 collinear points", function () {
    const json = JSON.parse(
      readFileSync(path.resolve("test/data/shapes/square.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel.getBoundedFaces()[0].getEdges()[0].subdivide();
    const result = new CollinearPointProcessor().run(dcel);

    expect(result.getBoundedFaces()[0].getEdges().length).toBe(4);
    expect(result.halfEdges.size).toBe(8);
    expect(result.vertices.size).toBe(4);
  });

  test("removes 4 collinear points", function () {
    const json = JSON.parse(
      readFileSync(path.resolve("test/data/shapes/square.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel.getBoundedFaces()[0].getEdges()[0].subdivide()?.subdivide();
    const result = new CollinearPointProcessor().run(dcel);

    expect(result.getBoundedFaces()[0].getEdges().length).toBe(4);
    expect(result.halfEdges.size).toBe(8);
    expect(result.vertices.size).toBe(4);
  });

  test("removes any collinear points on a simples square", function () {
    const dcel = Dcel.fromCoordinates([
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
    ]);

    const result = new CollinearPointProcessor().run(dcel);
    expect(result.vertices.size).toBe(4);
    expect(result.halfEdges.size).toBe(8);
    expect(result.getBoundedFaces()[0].getEdges().length).toBe(4);
  });
});
