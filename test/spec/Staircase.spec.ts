import CollinearPointProcessor from "@/src/c-oriented-schematization/CollinearPointProcessor";
import CRegular from "@/src/c-oriented-schematization/CRegular";
import CSchematization from "@/src/c-oriented-schematization/CSchematization";
import { Orientation } from "@/src/c-oriented-schematization/HalfEdgeClassGenerator";
import { style } from "@/src/c-oriented-schematization/schematization.style";
import { getClosestAssociatedAngle } from "@/src/c-oriented-schematization/Staircase";
import Dcel from "@/src/Dcel/Dcel";
import { TWO_PI } from "@/src/geometry/contstants";
import Polygon from "@/src/geometry/Polygon";
import Ring from "@/src/geometry/Ring";
import Subdivision from "@/src/geometry/Subdivision";
import { readFileSync } from "fs";
import path from "path";
import { describe, expect, test } from "vitest";
import { createStaircaseSetup } from "./test-setup";

describe("The staircase class", function () {
  test("returns a staircase region for a HalfEdge of class UB", function () {
    const staircase = createStaircaseSetup([2, 2], 0, Orientation.UB);
    expect(staircase?.region).toEqual(
      Polygon.fromCoordinates([
        [
          [0, 0],
          [2, 0],
          [2, 2],
          [0, 2],
        ],
      ]),
    );
  });

  test("returns a staircase region for a HalfEdge of class UB", function () {
    const staircase = createStaircaseSetup([-2, -2], 2, Orientation.UB);
    expect(staircase?.region).toEqual(
      Polygon.fromCoordinates([
        [
          [0, 0],
          [-2, 0],
          [-2, -2],
          [0, -2],
        ],
      ]),
    );
  });

  test("returns a staircase region for a HalfEdge of class UB", function () {
    const staircase = createStaircaseSetup([-10, 2], 2, Orientation.UB);
    expect(staircase?.region).toEqual(
      Polygon.fromCoordinates([
        [
          [0, 0],
          [0, 2],
          [-10, 2],
          [-10, 0],
        ],
      ]),
    );
  });
});

describe("Build staircase for a HalfEdge of class AD", function () {
  test("returns a staircase containing 7 Points", function () {
    const staircase = createStaircaseSetup([10, 10], 0, Orientation.AD, {
      style: { ...style, c: new CRegular(4) },
    });

    expect(staircase?.points?.length).toBe(7);
    expect(staircase?.region?.exteriorRing.length).toBeLessThanOrEqual(
      staircase?.points?.length ?? NaN,
    );
  });
});

// TO-DO: test staircase with head like for staircase of UD edges
describe("Build staircase for a HalfEdge of class UB", function () {
  test("returns a staircase containing a minimum of 5 Points", function () {
    const staircase = createStaircaseSetup([7, 5], 0, Orientation.UB);
    const points = staircase?.getStaircasePointsUB();
    expect(points?.length).toBeGreaterThanOrEqual(5);
  });
});

describe("Build staircase for a HalfEdge of class UD", function () {
  test("returns a staircase with a minimum of 9 points", function () {
    const staircase = createStaircaseSetup([7, 5], 3, Orientation.UD);
    const d2 = staircase?.points[staircase.points.length - 1];
    expect(staircase?.points?.length).toBeGreaterThanOrEqual(9);
    expect(7).toBeCloseTo(d2?.x ?? NaN, 10);
    expect(5).toBeCloseTo(d2?.y ?? NaN, 10);
  });

  test("returns a staircase where the area spanned between the first 4 points equals the area of the second last and the last 3 points", function () {
    const staircase = createStaircaseSetup([10, 4], 2, Orientation.UD);
    const appendedArea = new Polygon([
      new Ring(staircase?.points.slice(0, 4) ?? []),
    ]).area;
    const secondLastStep = new Polygon([
      new Ring(staircase?.points?.slice(-5, -2) ?? []),
    ]).area;
    const lastStep = new Polygon([new Ring(staircase?.points.slice(-3) ?? [])])
      .area;

    expect(appendedArea).toBeCloseTo(secondLastStep, 10);
    expect(appendedArea).toBeCloseTo(lastStep, 10);
    expect(secondLastStep).toBeCloseTo(lastStep, 10);
  });

  test("returns a staircase where the area spanned between the first 4 points equals the area of the second last and the last 3 points", function () {
    const staircase = createStaircaseSetup([30, 12], 3, Orientation.UD);
    const appendedArea = new Polygon([
      new Ring(staircase?.points.slice(0, 4) ?? []),
    ]).area;
    const secondLastStep = new Polygon([
      new Ring(staircase?.points.slice(-5, -2) ?? []),
    ]).area;
    const lastStep = new Polygon([new Ring(staircase?.points.slice(-3) ?? [])])
      .area;

    expect(appendedArea).toBeCloseTo(secondLastStep, 10);
    expect(appendedArea).toBeCloseTo(lastStep, 10);
    expect(secondLastStep).toBeCloseTo(lastStep, 10);
  });

  test("returns a staircase where the area spanned between the first 4 points equals the area of the second last and the last 3 points", function () {
    const staircase = createStaircaseSetup([-7, 5], 3, Orientation.UD);
    const appendedArea = new Polygon([
      new Ring(staircase?.points.slice(0, 4) ?? []),
    ]).area;
    const secondLastStep = new Polygon([
      new Ring(staircase?.points.slice(-5, -2) ?? []),
    ]).area;
    const lastStep = new Polygon([new Ring(staircase?.points.slice(-3) ?? [])])
      .area;

    expect(appendedArea).toBeCloseTo(secondLastStep, 10);
    expect(appendedArea).toBeCloseTo(lastStep, 10);
    expect(secondLastStep).toBeCloseTo(lastStep, 10);
  });

  test("returns a staircase where the area spanned between the first 4 points equals the area of the second last and the last 3 points", function () {
    const staircase = createStaircaseSetup([-7, 5], 0, Orientation.UD);
    const appendedArea = new Polygon([
      new Ring(staircase?.points.slice(0, 4) ?? []),
    ]).area;
    const secondLastStep = new Polygon([
      new Ring(staircase?.points.slice(-5, -2) ?? []),
    ]).area;
    const lastStep = new Polygon([new Ring(staircase?.points.slice(-3) ?? [])])
      .area;

    expect(appendedArea).toBeCloseTo(secondLastStep, 10);
    expect(appendedArea).toBeCloseTo(lastStep, 10);
    expect(secondLastStep).toBeCloseTo(lastStep, 10);
  });

  test("returns a staircase with a minimum of 9 points", function () {
    const staircase = createStaircaseSetup([-7, -5], 0, Orientation.UD);
    const d2 = staircase?.points[staircase.points.length - 1];

    expect(staircase?.points?.length).toBeGreaterThanOrEqual(9);
    expect(-7).toBeCloseTo(d2?.x ?? NaN, 10);
    expect(-5).toBeCloseTo(d2?.y ?? NaN, 10);
  });

  test("returns a staircase with a minimum of 9 points", function () {
    const staircase = createStaircaseSetup([2.5, 1], 2, Orientation.UD);
    const d2 = staircase?.points[staircase.points.length - 1];

    expect(staircase?.points?.length).toBeGreaterThanOrEqual(9);
    expect(2.5).toBeCloseTo(d2?.x ?? NaN, 10);
    expect(1).toBeCloseTo(d2?.y ?? NaN, 10);
  });
});

describe("getStepArea(),", function () {
  test("returns the correct area a step adds/subtracts in C(2) ", function () {
    const staircase = createStaircaseSetup([10, 4], NaN, Orientation.AD);
    const stepArea = staircase?.getStepArea(3, 1);
    expect(stepArea).toBe(1.5);
  });

  test("returns the correct area a step adds/subtracts in C(4)", function () {
    const staircase = createStaircaseSetup([10, 4], NaN, Orientation.AD, {
      style: { ...style, c: new CRegular(4) },
    });
    const stepArea = staircase?.getStepArea(3, 1);
    expect(stepArea).toBeCloseTo(1.0607, 3);
  });
});

describe("getClosestAssociatedAngle() returns closest associated angle for an edge", function () {
  test("when edge is in sector 0 and the assigned Direction is 3", function () {
    const dcel = new Dcel();
    const o = dcel.addVertex(0, 0);
    const d = dcel.addVertex(10, 4);
    const edge = dcel.addHalfEdge(o, d);
    edge.twin = dcel.addHalfEdge(d, o);
    edge.twin.twin = edge;

    expect(
      getClosestAssociatedAngle(edge, new CRegular(2), Orientation.UD, 3),
    ).toBe(0);
  });

  test("when edge is in sector 0 and the assigned direction is 2", function () {
    const dcel = new Dcel();
    const o = dcel.addVertex(0, 0);
    const d = dcel.addVertex(10, 4);
    const edge = dcel.addHalfEdge(o, d);
    edge.twin = dcel.addHalfEdge(d, o);
    edge.twin.twin = edge;

    expect(
      getClosestAssociatedAngle(edge, new CRegular(2), Orientation.UD, 2),
    ).toBe(Math.PI * 0.5);
  });

  test("when edge is in sector 1 and the assigned direction is 0", function () {
    const dcel = new Dcel();
    const o = dcel.addVertex(0, 0);
    const d = dcel.addVertex(-10, 4);
    const edge = dcel.addHalfEdge(o, d);
    edge.twin = dcel.addHalfEdge(d, o);
    edge.twin.twin = edge;

    expect(
      getClosestAssociatedAngle(edge, new CRegular(2), Orientation.UD, 0),
    ).toBe(Math.PI * 0.5);
  });

  test("when edge is in sector 1 and the assigned direction is 3", function () {
    const dcel = new Dcel();
    const o = dcel.addVertex(0, 0);
    const d = dcel.addVertex(-10, 4);
    const edge = dcel.addHalfEdge(o, d);
    edge.twin = dcel.addHalfEdge(d, o);
    edge.twin.twin = edge;

    expect(
      getClosestAssociatedAngle(edge, new CRegular(2), Orientation.UD, 3),
    ).toBe(Math.PI);
  });

  test("when edge is in sector 2 and the assigned direction is 1", function () {
    const dcel = new Dcel();
    const o = dcel.addVertex(0, 0);
    const d = dcel.addVertex(-10, -4);
    const edge = dcel.addHalfEdge(o, d);
    edge.twin = dcel.addHalfEdge(d, o);
    edge.twin.twin = edge;

    expect(
      getClosestAssociatedAngle(edge, new CRegular(2), Orientation.UD, 1),
    ).toBe(Math.PI);
  });

  test("when edge is in sector 2 and the assigned direction is 0", function () {
    const dcel = new Dcel();
    const o = dcel.addVertex(0, 0);
    const d = dcel.addVertex(-10, -4);
    const edge = dcel.addHalfEdge(o, d);
    edge.twin = dcel.addHalfEdge(d, o);
    edge.twin.twin = edge;

    expect(
      getClosestAssociatedAngle(edge, new CRegular(2), Orientation.UD, 0),
    ).toBe(Math.PI * 1.5);
  });

  test("when edge is in sector 3 and the assigned direction is 2", function () {
    const dcel = new Dcel();
    const o = dcel.addVertex(0, 0);
    const d = dcel.addVertex(10, -4);
    const edge = dcel.addHalfEdge(o, d);
    edge.twin = dcel.addHalfEdge(d, o);
    edge.twin.twin = edge;

    expect(
      getClosestAssociatedAngle(edge, new CRegular(2), Orientation.UD, 2),
    ).toBe((TWO_PI / new CRegular(2).directions.length) * 3);
  });
});

describe("Staircases for a diamond rotated square of side length 1)", function () {
  test("are bound within a reasonable area", function () {
    const subdivision = Subdivision.fromCoordinates([
      [
        [
          [
            [1, 0],
            [0, 1],
            [-1, 0],
            [0, -1],
          ],
        ],
      ],
    ]);
    const dcel = Dcel.fromSubdivision(subdivision);
    const schematization = new CSchematization();
    const constrainedDcel = schematization.constrainAngles(dcel);
    const { xMin, xMax, yMin, yMax } = constrainedDcel.getBbox();
    expect(xMin).toBeGreaterThanOrEqual(-1);
    expect(xMin).toBeLessThanOrEqual(0);
    expect(xMax).toBeGreaterThanOrEqual(0);
    expect(xMax).toBeLessThanOrEqual(1);
    expect(yMin).toBeGreaterThanOrEqual(-1);
    expect(yMin).toBeLessThanOrEqual(0);
    expect(yMax).toBeGreaterThanOrEqual(0);
    expect(yMax).toBeLessThanOrEqual(1);
  });

  test("can be simplified without throwing an error", function () {
    const subdivision = Subdivision.fromCoordinates([
      [
        [
          [
            [1, 0],
            [0, 1],
            [-1, 0],
            [0, -1],
          ],
        ],
      ],
    ]);
    const dcel = Dcel.fromSubdivision(subdivision);
    const schematization = new CSchematization();
    const constrained = schematization.constrainAngles(dcel);
    expect(() => schematization.simplify(constrained)).not.toThrow();
  });
});

describe("Floating point precision in staircase generation", function () {
  test.fails(
    "Checks potentially affected staircase vertex in triangle.json",
    function () {
      const json = JSON.parse(
        readFileSync(path.resolve("test/data/shapes/triangle.json"), "utf8"),
      );

      let dcel = Dcel.fromGeoJSON(json);
      const schematization = new CSchematization();

      dcel = schematization.preProcess(dcel);
      dcel = schematization.constrainAngles(dcel);
      const collinearPointRemover = new CollinearPointProcessor();
      dcel = collinearPointRemover.run(dcel);

      // Get all vertices
      const vertices = Array.from(dcel.getVertices());
      const affectedVertex = vertices.find(
        (v) => v.x === 7.5 && v.y > 4.5 && v.y < 5.5,
      );
      expect(affectedVertex?.y).toBe(5);
    },
  );
});
