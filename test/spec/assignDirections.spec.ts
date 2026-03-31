import CRegular from "@/src/c-oriented-schematization/CRegular";
import { beforeEach, describe, expect, test } from "vitest";
import {
  createEdgeVertexSetup,
  getClassification,
  idOr,
  TestSetup,
} from "./test-setup";

describe("Given the examples in the paper of Buchin et al., directions are assigned, correctly on example", function () {
  let s: TestSetup;

  beforeEach(() => {
    s = createEdgeVertexSetup();
  });

  test("a", () => {
    // This example needs a significant vertex even though it is not like this in the paper
    // however, without the significant vertex, the direction is not unambiguous
    const assignedDirections = getClassification(
      s,
      [s.directions.od53, s.directions.od217],
      "assignedDirection",
      {
        significantVertices: [idOr(s.origin)],
      },
    );
    expect(assignedDirections).toEqual([1, 2]);
  });

  test("b", () => {
    // This example needs a significant vertex even though it is not like this in the paper
    // however, without the significant vertex, the direction is not unambiguous
    const assignedDirections = getClassification(
      s,
      [s.directions.od53, s.directions.od180, s.directions.od270],
      "assignedDirection",
      { significantVertices: [idOr(s.origin)] },
    );
    expect(assignedDirections).toEqual([1, 2, 3]);
  });

  // TO-DO: fix test / assignment of directions
  test("c", function () {
    const assignedDirections = getClassification(
      s,
      [s.directions.od37, s.directions.od90, s.directions.od143],
      "assignedDirection",
      { significantVertices: [idOr(s.origin)] },
    );
    expect(assignedDirections).toEqual([0, 1, 2]);
  });

  test("d", function () {
    const assignedDirections = getClassification(
      s,
      [s.directions.od37, s.directions.od76],
      "assignedDirection",
      {
        significantVertices: [idOr(s.origin)],
      },
    );
    expect(assignedDirections).toEqual([0, 1]);
  });

  test("e", function () {
    const assignedDirections = getClassification(
      s,
      [s.directions.od37, s.directions.od53, s.directions.od76],
      "assignedDirection",
      { significantVertices: [idOr(s.origin)] },
    );
    expect(assignedDirections).toEqual([0, 1, 2]);
  });

  test("f", function () {
    const assignedDirections = getClassification(
      s,
      [
        s.directions.od0,
        s.directions.od37,
        s.directions.od53,
        s.directions.od76,
      ],
      "assignedDirection",
      { significantVertices: [idOr(s.origin)] },
    );
    expect(assignedDirections).toEqual([3, 0, 1, 2]);
  });

  test("g", function () {
    const assignedDirections = getClassification(
      s,
      [
        s.directions.od315,
        s.directions.od333,
        s.directions.od53,
        s.directions.od76,
      ],
      "assignedDirection",
      { significantVertices: [idOr(s.origin)] },
    );
    expect(assignedDirections).toEqual([1, 2, 3, 0]);
  });

  test("h", function () {
    // This example needs a significant vertex even though it is not like this in the paper
    // however, without the significant vertex, the direction is not unambiguous
    const assignedDirections = getClassification(
      s,
      [s.directions.od53, s.directions.od217],
      "assignedDirection",
      {
        c: new CRegular(4),
        significantVertices: [idOr(s.origin)],
      },
    );

    expect(assignedDirections).toEqual([1, 5]);
  });

  test("i", function () {
    // This example needs a significant vertex even though it is not like this in the paper
    // however, without the significant vertex, the direction is not unambiguous
    const assignedDirections = getClassification(
      s,
      [s.directions.od53, s.directions.od180, s.directions.od270],
      "assignedDirection",
      { c: new CRegular(4), significantVertices: [idOr(s.origin)] },
    );

    expect(assignedDirections).toEqual([1, 4, 6]);
  });

  test("j", function () {
    const assignedDirections = getClassification(
      s,
      [s.directions.od37, s.directions.od90, s.directions.od143],
      "assignedDirection",
      { significantVertices: [idOr(s.origin)], c: new CRegular(4) },
    );

    expect(assignedDirections).toEqual([1, 2, 3]);
  });

  test("k", function () {
    const assignedDirections = getClassification(
      s,
      [s.directions.od37, s.directions.od76],
      "assignedDirection",
      {
        significantVertices: [idOr(s.origin)],
        c: new CRegular(4),
      },
    );

    expect(assignedDirections).toEqual([1, 2]);
  });

  test("l", function () {
    const assignedDirections = getClassification(
      s,
      [s.directions.od37, s.directions.od53, s.directions.od76],
      "assignedDirection",
      { significantVertices: [idOr(s.origin)], c: new CRegular(4) },
    );

    expect(assignedDirections).toEqual([0, 1, 2]);
  });

  test("m", function () {
    const assignedDirections = getClassification(
      s,
      [
        s.directions.od0,
        s.directions.od14,
        s.directions.od53,
        s.directions.od76,
      ],
      "assignedDirection",
      { significantVertices: [idOr(s.origin)], c: new CRegular(4) },
    );

    expect(assignedDirections).toEqual([7, 0, 1, 2]);
  });

  test("n", function () {
    const assignedDirections = getClassification(
      s,
      [
        s.directions.od315,
        s.directions.od333,
        s.directions.od53,
        s.directions.od76,
      ],
      "assignedDirection",
      { significantVertices: [idOr(s.origin)], c: new CRegular(4) },
    );

    expect(assignedDirections).toEqual([1, 2, 7, 0]);
  });
});

describe("assignDirections(config.c) on own examples", function () {
  let s: TestSetup;

  beforeEach(function () {
    s = createEdgeVertexSetup();
  });

  test("with 4 edges (A) in C(2)", function () {
    const assignedDirections = getClassification(
      s,
      [
        s.directions.od90,
        s.directions.od143,
        s.directions.od180,
        s.directions.od217,
      ],
      "assignedDirection",
      { significantVertices: [idOr(s.origin)] },
    );
    expect(assignedDirections).toEqual([0, 1, 2, 3]);
  });

  test("with 4 edges (B) in C(2)", function () {
    const assignedDirections = getClassification(
      s,
      [
        s.directions.od90,
        s.directions.od104,
        s.directions.od180,
        s.directions.od217,
      ],
      "assignedDirection",
      { significantVertices: [idOr(s.origin)] },
    );
    expect(assignedDirections).toEqual([0, 1, 2, 3]);
  });

  test("with 4 edges (C) in C(2)", function () {
    const assignedDirections = getClassification(
      s,
      [
        s.directions.od90,
        s.directions.od153,
        s.directions.od180,
        s.directions.od243,
      ],
      "assignedDirection",
      { significantVertices: [idOr(s.origin)] },
    );
    expect(assignedDirections).toEqual([0, 1, 2, 3]);
  });

  test("with 4 edges (D) in C(2)", function () {
    const assignedDirections = getClassification(
      s,
      [
        s.directions.od153,
        s.directions.od166,
        s.directions.od180,
        s.directions.od243,
      ],
      "assignedDirection",
      { significantVertices: [idOr(s.origin)] },
    );
    expect(assignedDirections).toEqual([0, 1, 2, 3]);
  });

  test("with 4 edges (E) in C(3)", function () {
    const assignedDirections = getClassification(
      s,
      [
        s.directions.od153,
        s.directions.od166,
        s.directions.od180,
        s.directions.od243,
      ],
      "assignedDirection",
      { c: new CRegular(3), significantVertices: [idOr(s.origin)] },
    );
    expect(assignedDirections).toEqual([1, 2, 3, 4]);
  });

  test("with 4 edges (F) in C(2)", function () {
    const assignedDirections = getClassification(
      s,
      [s.directions.od0, s.directions.od14, s.directions.od333],
      "assignedDirection",
      { significantVertices: [idOr(s.origin)] },
    );
    expect(assignedDirections).toEqual([0, 1, 3]);
  });

  test("with 4 edges (G) in C(2)", function () {
    const assignedDirections = getClassification(
      s,
      [
        s.directions.od14,
        s.directions.od104,
        s.directions.od243,
        s.directions.od333,
      ],
      "assignedDirection",
      { significantVertices: [idOr(s.origin)] },
    );
    expect(assignedDirections).toEqual([0, 1, 2, 3]);
  });

  test("with 3 edges (H) in C(2)", function () {
    const assignedDirections = getClassification(
      s,
      [s.directions.od14, s.directions.od243, s.directions.od284],
      "assignedDirection",
      { significantVertices: [idOr(s.origin)] },
    );
    expect(assignedDirections).toEqual([0, 2, 3]);
  });
});
