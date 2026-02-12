// import fs from "fs";
// import path from "path";
import Dcel from "@/src/Dcel/Dcel";
import CRegular from "@/src/c-oriented-schematization/CRegular";
import { Orientation } from "@/src/c-oriented-schematization/HalfEdgeClassGenerator";
import { getClosestAssociatedAngle } from "@/src/c-oriented-schematization/Staircase";
import { style } from "@/src/c-oriented-schematization/schematization.style";
import Polygon from "@/src/geometry/Polygon";
import Ring from "@/src/geometry/Ring";
import { createStaircaseSetup } from "./test-setup";

describe("The staircase class", function () {
  it("returns a staircase region for a HalfEdge of class UB", function () {
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

  it("returns a staircase region for a HalfEdge of class UB", function () {
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

  it("returns a staircase region for a HalfEdge of class UB", function () {
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
  it("returns a staircase containing 7 Points", function () {
    const staircase = createStaircaseSetup([10, 10], 0, Orientation.AD, {
      style: { ...style, c: new CRegular(4) },
    });

    expect(staircase?.points?.length).toBe(7);
    expect(staircase?.region?.exteriorRing.length).toBeLessThanOrEqual(
      staircase?.points?.length ?? NaN,
    );
  });
});

// TODO: test staircase with head like for staircase of UD edges
describe("Build staircase for a HalfEdge of class UB", function () {
  it("returns a staircase containing a minimum of 5 Points", function () {
    const staircase = createStaircaseSetup([7, 5], 0, Orientation.UB);
    const points = staircase?.getStaircasePointsUB();
    expect(points?.length).toBeGreaterThanOrEqual(5);
  });
});

describe("Build staircase for a HalfEdge of class UD", function () {
  it("returns a staircase with a minimum of 9 points", function () {
    const staircase = createStaircaseSetup([7, 5], 3, Orientation.UD);
    const d2 = staircase?.points[staircase.points.length - 1];
    expect(staircase?.points?.length).toBeGreaterThanOrEqual(9);
    expect(7).toBeCloseTo(d2?.x ?? NaN, 10);
    expect(5).toBeCloseTo(d2?.y ?? NaN, 10);
  });

  it("returns a staircase where the area spanned between the first 4 points equals the area of the second last and the last 3 points", function () {
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

  it("returns a staircase where the area spanned between the first 4 points equals the area of the second last and the last 3 points", function () {
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

  it("returns a staircase where the area spanned between the first 4 points equals the area of the second last and the last 3 points", function () {
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

  it("returns a staircase where the area spanned between the first 4 points equals the area of the second last and the last 3 points", function () {
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

  it("returns a staircase with a minimum of 9 points", function () {
    const staircase = createStaircaseSetup([-7, -5], 0, Orientation.UD);
    const d2 = staircase?.points[staircase.points.length - 1];

    expect(staircase?.points?.length).toBeGreaterThanOrEqual(9);
    expect(-7).toBeCloseTo(d2?.x ?? NaN, 10);
    expect(-5).toBeCloseTo(d2?.y ?? NaN, 10);
  });

  it("returns a staircase with a minimum of 9 points", function () {
    const staircase = createStaircaseSetup([2.5, 1], 2, Orientation.UD);
    const d2 = staircase?.points[staircase.points.length - 1];

    expect(staircase?.points?.length).toBeGreaterThanOrEqual(9);
    expect(2.5).toBeCloseTo(d2?.x ?? NaN, 10);
    expect(1).toBeCloseTo(d2?.y ?? NaN, 10);
  });
});

describe("getStepArea(),", function () {
  it("returns the correct area a step adds/subtracts in C(2) ", function () {
    const staircase = createStaircaseSetup([10, 4], NaN, Orientation.AD);
    const stepArea = staircase?.getStepArea(3, 1);
    expect(stepArea).toBe(1.5);
  });

  it("returns the correct area a step adds/subtracts in C(4)", function () {
    const staircase = createStaircaseSetup([10, 4], NaN, Orientation.AD, {
      style: { ...style, c: new CRegular(4) },
    });
    const stepArea = staircase?.getStepArea(3, 1);
    expect(stepArea).toBeCloseTo(1.0607, 3);
  });
});

describe("getClosestAssociatedAngle() returns closest associated angle for an edge", function () {
  it("when edge is in sector 0 and the assigned Direction is 3", function () {
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

  it("when edge is in sector 0 and the assigned direction is 2", function () {
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

  it("when edge is in sector 1 and the assigned direction is 0", function () {
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

  it("when edge is in sector 1 and the assigned direction is 3", function () {
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

  it("when edge is in sector 2 and the assigned direction is 1", function () {
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

  it("when edge is in sector 2 and the assigned direction is 0", function () {
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

  it("when edge is in sector 3 and the assigned direction is 2", function () {
    const dcel = new Dcel();
    const o = dcel.addVertex(0, 0);
    const d = dcel.addVertex(10, -4);
    const edge = dcel.addHalfEdge(o, d);
    edge.twin = dcel.addHalfEdge(d, o);
    edge.twin.twin = edge;

    expect(
      getClosestAssociatedAngle(edge, new CRegular(2), Orientation.UD, 2),
    ).toBe(((Math.PI * 2) / new CRegular(2).directions.length) * 3);
  });
});
