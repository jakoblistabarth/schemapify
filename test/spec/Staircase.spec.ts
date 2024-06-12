import fs from "fs";
import path from "path";
import Dcel from "@/src/Dcel/Dcel";
import CRegular from "@/src/c-oriented-schematization/CRegular";
import { Orientation } from "@/src/c-oriented-schematization/HalfEdgeClassGenerator";
import Vertex from "@/src/Dcel/Vertex";
import Staircase from "@/src/c-oriented-schematization/Staircase";
import Polygon from "@/src/geometry/Polygon";
import { style } from "@/src/c-oriented-schematization/schematization.style";
import Ring from "@/src/geometry/Ring";
import CSchematization from "@/src/c-oriented-schematization/CSchematization";

describe("The staircase class", function () {
  it("returns a staircase region for a HalfEdge of class UB", function () {
    const dcel = new Dcel();

    const o = new Vertex(0, 0, dcel);
    const d = new Vertex(2, 2, dcel);
    const edge = dcel.addHalfEdge(o, d);
    const twin = dcel.addHalfEdge(d, o);
    edge.twin = twin;
    twin.twin = edge;
    edge.class = Orientation.UB;
    edge.assignedDirection = 0;

    const staircase = new Staircase(edge, style);
    expect(staircase.region).toEqual(
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
    const dcel = new Dcel();

    const o = new Vertex(0, 0, dcel);
    const d = new Vertex(-2, -2, dcel);
    const edge = dcel.addHalfEdge(o, d);
    const twin = dcel.addHalfEdge(d, o);
    edge.twin = twin;
    twin.twin = edge;
    edge.class = Orientation.UB;
    edge.assignedDirection = 2;

    const staircase = new Staircase(edge, style);

    expect(staircase.region).toEqual(
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
    const dcel = new Dcel();

    const o = new Vertex(0, 0, dcel);
    const d = new Vertex(-10, 2, dcel);
    const edge = dcel.addHalfEdge(o, d);
    const twin = dcel.addHalfEdge(d, o);
    edge.twin = twin;
    twin.twin = edge;
    edge.class = Orientation.UB;
    edge.assignedDirection = 2;

    const staircase = new Staircase(edge, style);
    expect(staircase.region).toEqual(
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
    const dcel = new Dcel();

    const o = new Vertex(0, 0, dcel);
    const d = new Vertex(10, 10, dcel);
    const edge = dcel.addHalfEdge(o, d);
    edge.twin = dcel.addHalfEdge(d, o);
    edge.twin.twin = edge;
    edge.class = Orientation.AD;
    edge.assignedDirection = 0;

    edge.staircase = new Staircase(edge, { ...style, c: new CRegular(4) });
    edge.staircase.points = edge.staircase.getStaircasePoints();
    expect(edge.staircase.points?.length).toBe(7);
    expect(edge.staircase.region?.exteriorRing.length).toBeLessThanOrEqual(
      edge.staircase.points.length,
    );
  });
});

// TODO: test staircase with head like for staircase of UD edges
describe("Build staircase for a HalfEdge of class UB", function () {
  it("returns a staircase containing a minimum of 5 Points", function () {
    const dcel = new Dcel();

    const o = new Vertex(1, 1, dcel);
    const d = new Vertex(7, 5, dcel);
    const edge = dcel.addHalfEdge(o, d);
    edge.twin = dcel.addHalfEdge(d, o);
    edge.twin.twin = edge;
    edge.class = Orientation.UB;
    edge.assignedDirection = 0;

    const staircase = new Staircase(edge, { ...style, c: new CRegular(2) });
    const points = staircase.getStaircasePointsUB();
    expect(points?.length).toBeGreaterThanOrEqual(5);
  });
});

describe("Build staircase for a HalfEdge of class UD", function () {
  it("returns a staircase with a minimum of 9 points", function () {
    const dcel = new Dcel();

    const o = new Vertex(0, 0, dcel);
    const d = new Vertex(7, 5, dcel);
    const edge = dcel.addHalfEdge(o, d);
    edge.twin = dcel.addHalfEdge(d, o);
    edge.twin.twin = edge;
    edge.class = Orientation.UD;
    edge.assignedDirection = 3;

    const staircase = new Staircase(edge, { ...style, c: new CRegular(2) });
    const d2 = staircase.points[staircase.points.length - 1];

    expect(staircase.points?.length).toBeGreaterThanOrEqual(9);
    expect(d.x).toBeCloseTo(d2.x, 10);
    expect(d.y).toBeCloseTo(d2.y, 10);
  });

  it("returns a staircase where the area spanned between the first 4 points equals the area of the second last and the last 3 points", function () {
    const dcel = new Dcel();

    const o = new Vertex(0, 0, dcel);
    const d = new Vertex(10, 4, dcel);
    const edge = dcel.addHalfEdge(o, d);
    edge.twin = dcel.addHalfEdge(d, o);
    edge.twin.twin = edge;
    edge.class = Orientation.UD;
    edge.assignedDirection = 2;

    const staircase = new Staircase(edge, { ...style, c: new CRegular(2) });

    const appendedArea = new Polygon([new Ring(staircase.points.slice(0, 4))])
      .area;
    const secondLastStep = new Polygon([
      new Ring(staircase.points.slice(-5, -2)),
    ]).area;
    const lastStep = new Polygon([new Ring(staircase.points.slice(-3))]).area;

    expect(appendedArea).toBeCloseTo(secondLastStep, 10);
    expect(appendedArea).toBeCloseTo(lastStep, 10);
    expect(secondLastStep).toBeCloseTo(lastStep, 10);
  });

  it("returns a staircase where the area spanned between the first 4 points equals the area of the second last and the last 3 points", function () {
    const dcel = new Dcel();

    const o = new Vertex(0, 0, dcel);
    const d = new Vertex(30, 12, dcel);
    const edge = dcel.addHalfEdge(o, d);
    edge.twin = dcel.addHalfEdge(d, o);
    edge.twin.twin = edge;
    edge.class = Orientation.UD;
    edge.assignedDirection = 3;

    const staircase = new Staircase(edge, { ...style, c: new CRegular(2) });

    const appendedArea = new Polygon([new Ring(staircase.points.slice(0, 4))])
      .area;
    const secondLastStep = new Polygon([
      new Ring(staircase.points.slice(-5, -2)),
    ]).area;
    const lastStep = new Polygon([new Ring(staircase.points.slice(-3))]).area;

    expect(appendedArea).toBeCloseTo(secondLastStep, 10);
    expect(appendedArea).toBeCloseTo(lastStep, 10);
    expect(secondLastStep).toBeCloseTo(lastStep, 10);
  });

  it("returns a staircase where the area spanned between the first 4 points equals the area of the second last and the last 3 points", function () {
    const dcel = new Dcel();

    const o = new Vertex(0, 0, dcel);
    const d = new Vertex(-7, 5, dcel);
    const edge = dcel.addHalfEdge(o, d);
    edge.twin = dcel.addHalfEdge(d, o);
    edge.twin.twin = edge;
    edge.class = Orientation.UD;
    edge.assignedDirection = 3;

    const staircase = new Staircase(edge, { ...style, c: new CRegular(2) });

    const appendedArea = new Polygon([new Ring(staircase.points.slice(0, 4))])
      .area;
    const secondLastStep = new Polygon([
      new Ring(staircase.points.slice(-5, -2)),
    ]).area;
    const lastStep = new Polygon([new Ring(staircase.points.slice(-3))]).area;

    expect(appendedArea).toBeCloseTo(secondLastStep, 10);
    expect(appendedArea).toBeCloseTo(lastStep, 10);
    expect(secondLastStep).toBeCloseTo(lastStep, 10);
  });

  it("returns a staircase where the area spanned between the first 4 points equals the area of the second last and the last 3 points", function () {
    const dcel = new Dcel();

    const o = new Vertex(0, 0, dcel);
    const d = new Vertex(-7, 5, dcel);
    const edge = dcel.addHalfEdge(o, d);
    edge.twin = dcel.addHalfEdge(d, o);
    edge.twin.twin = edge;
    edge.class = Orientation.UD;
    edge.assignedDirection = 0;

    const staircase = new Staircase(edge, { ...style, c: new CRegular(2) });

    const appendedArea = new Polygon([new Ring(staircase.points.slice(0, 4))])
      .area;
    const secondLastStep = new Polygon([
      new Ring(staircase.points.slice(-5, -2)),
    ]).area;
    const lastStep = new Polygon([new Ring(staircase.points.slice(-3))]).area;

    expect(appendedArea).toBeCloseTo(secondLastStep, 10);
    expect(appendedArea).toBeCloseTo(lastStep, 10);
    expect(secondLastStep).toBeCloseTo(lastStep, 10);
  });

  it("returns a staircase with a minimum of 9 points", function () {
    const dcel = new Dcel();

    const o = new Vertex(0, 0, dcel);
    const d = new Vertex(-7, -5, dcel);
    const edge = dcel.addHalfEdge(o, d);
    edge.twin = dcel.addHalfEdge(d, o);
    edge.twin.twin = edge;
    edge.class = Orientation.UD;
    edge.assignedDirection = 0;

    const staircase = new Staircase(edge, { ...style, c: new CRegular(2) });
    const d2 = staircase.points[staircase.points.length - 1];

    expect(staircase.points?.length).toBeGreaterThanOrEqual(9);
    expect(d.x).toBeCloseTo(d2.x, 10);
    expect(d.y).toBeCloseTo(d2.y, 10);
  });

  it("returns a staircase with a minimum of 9 points", function () {
    const dcel = new Dcel();

    const o = new Vertex(0, 0, dcel);
    const d = new Vertex(2.5, 1, dcel);
    const edge = dcel.addHalfEdge(o, d);
    edge.twin = dcel.addHalfEdge(d, o);
    edge.twin.twin = edge;
    edge.class = Orientation.UD;
    edge.assignedDirection = 2;

    const staircase = new Staircase(edge, { ...style, c: new CRegular(2) });
    const d2 = staircase.points[staircase.points.length - 1];

    expect(staircase.points?.length).toBeGreaterThanOrEqual(9);
    expect(d.x).toBeCloseTo(d2.x, 10);
    expect(d.y).toBeCloseTo(d2.y, 10);
  });
});

describe("getStepArea(),", function () {
  it("returns the correct area a step adds/subtracts in C(2) ", function () {
    const dcel = new Dcel();

    const o = new Vertex(0, 0, dcel);
    const d = new Vertex(10, 4, dcel);
    const edge = dcel.addHalfEdge(o, d);
    edge.twin = dcel.addHalfEdge(d, o);
    edge.twin.twin = edge;

    const staircase = new Staircase(edge, { ...style, c: new CRegular(2) });
    const stepArea = staircase.getStepArea(3, 1);
    expect(stepArea).toBe(1.5);
  });

  it("returns the correct area a step adds/subtracts in C(4)", function () {
    const dcel = new Dcel();

    const o = new Vertex(0, 0, dcel);
    const d = new Vertex(10, 4, dcel);
    const edge = dcel.addHalfEdge(o, d);
    edge.twin = dcel.addHalfEdge(d, o);
    edge.twin.twin = edge;

    const staircase = new Staircase(edge, { ...style, c: new CRegular(4) });
    const stepArea = staircase.getStepArea(3, 1);
    expect(stepArea).toBeCloseTo(1.0607, 3);
  });
});

describe("getClosestAssociatedAngle() returns closest associated angle for an edge", function () {
  it("when edge is in sector 0 and the assigned Direction is 3", function () {
    const dcel = new Dcel();

    const o = new Vertex(0, 0, dcel);
    const d = new Vertex(10, 4, dcel);
    const edge = dcel.addHalfEdge(o, d);
    edge.twin = dcel.addHalfEdge(d, o);
    edge.twin.twin = edge;
    edge.class = Orientation.UD;
    edge.assignedDirection = 3;

    expect(edge.getClosestAssociatedAngle(new CRegular(2))).toBe(0);
  });

  it("when edge is in sector 0 and the assigned direction is 2", function () {
    const dcel = new Dcel();

    const o = new Vertex(0, 0, dcel);
    const d = new Vertex(10, 4, dcel);
    const edge = dcel.addHalfEdge(o, d);
    edge.twin = dcel.addHalfEdge(d, o);
    edge.twin.twin = edge;
    edge.class = Orientation.UD;
    edge.assignedDirection = 2;

    expect(edge.getClosestAssociatedAngle(new CRegular(2))).toBe(Math.PI * 0.5);
  });

  it("when edge is in sector 1 and the assigned direction is 0", function () {
    const dcel = new Dcel();

    const o = new Vertex(0, 0, dcel);
    const d = new Vertex(-10, 4, dcel);
    const edge = dcel.addHalfEdge(o, d);
    edge.twin = dcel.addHalfEdge(d, o);
    edge.twin.twin = edge;
    edge.class = Orientation.UD;
    edge.assignedDirection = 0;

    expect(edge.getClosestAssociatedAngle(new CRegular(2))).toBe(Math.PI * 0.5);
  });

  it("when edge is in sector 1 and the assigned direction is 3", function () {
    const dcel = new Dcel();

    const o = new Vertex(0, 0, dcel);
    const d = new Vertex(-10, 4, dcel);
    const edge = dcel.addHalfEdge(o, d);
    edge.twin = dcel.addHalfEdge(d, o);
    edge.twin.twin = edge;
    edge.class = Orientation.UD;
    edge.assignedDirection = 3;

    expect(edge.getClosestAssociatedAngle(new CRegular(2))).toBe(Math.PI);
  });

  it("when edge is in sector 2 and the assigned direction is 1", function () {
    const dcel = new Dcel();

    const o = new Vertex(0, 0, dcel);
    const d = new Vertex(-10, -4, dcel);
    const edge = dcel.addHalfEdge(o, d);
    edge.twin = dcel.addHalfEdge(d, o);
    edge.twin.twin = edge;
    edge.class = Orientation.UD;
    edge.assignedDirection = 1;

    expect(edge.getClosestAssociatedAngle(new CRegular(2))).toBe(Math.PI);
  });

  it("when edge is in sector 2 and the assigned direction is 0", function () {
    const dcel = new Dcel();

    const o = new Vertex(0, 0, dcel);
    const d = new Vertex(-10, -4, dcel);
    const edge = dcel.addHalfEdge(o, d);
    edge.twin = dcel.addHalfEdge(d, o);
    edge.twin.twin = edge;
    edge.class = Orientation.UD;
    edge.assignedDirection = 0;

    expect(edge.getClosestAssociatedAngle(new CRegular(2))).toBe(Math.PI * 1.5);
  });

  it("when edge is in sector 3 and the assigned direction is 2", function () {
    const dcel = new Dcel();

    const o = new Vertex(0, 0, dcel);
    const d = new Vertex(10, -4, dcel);
    const edge = dcel.addHalfEdge(o, d);
    edge.twin = dcel.addHalfEdge(d, o);
    edge.twin.twin = edge;
    edge.class = Orientation.UD;
    edge.assignedDirection = 2;

    expect(edge.getClosestAssociatedAngle(new CRegular(2))).toBe(
      ((Math.PI * 2) / new CRegular(2).directions.length) * 3,
    );
  });
});

describe("Staircaseregions incident to a certain vertex are always interfering with each other", function () {
  // TODO: add more specs with other epsilon
  it("with an epsilon of 0.05", function () {
    const input = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/triangle-unaligned.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(input);
    const schematization = new CSchematization();
    schematization.preProcess(dcel);
    schematization.classify(dcel);
    schematization.addStaircases(dcel);
    schematization.calculateStaircases(dcel);
    const v = dcel.findVertex(0, 11);
    expect(v?.edges[0].staircase?.interferesWith.length).toBeGreaterThan(0);
    expect(v?.edges[1].staircase?.interferesWith.length).toBeGreaterThan(0);
  });
});
