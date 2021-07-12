import fs from "fs";
import path from "path";
import Point from "../src/lib/geometry/Point";
import Configuration, { OuterEdge } from "../src/lib/c-oriented-schematization/Configuration";
import Dcel from "../src/lib/DCEL/Dcel";
import { createConfigurationSetup } from "./test-setup";

describe("getTrack()", function () {
  it("return the correct angles for the reflex point for a square shape", function () {
    const json = JSON.parse(fs.readFileSync(path.resolve("data/shapes/square.json"), "utf8"));
    const dcel = Dcel.fromGeoJSON(json);

    const outerEdge1 = dcel.getBoundedFaces()[0].edge;
    outerEdge1.configuration = new Configuration(outerEdge1);
    const outerEdge2 = outerEdge1.next;
    outerEdge2.configuration = new Configuration(outerEdge2);

    expect(outerEdge1.configuration.getTrack(OuterEdge.PREV).angle).toBe(Math.PI * 1.5);
    expect(outerEdge1.configuration.getTrack(OuterEdge.NEXT).angle).toBe(Math.PI * 0.5);
    expect(outerEdge2.configuration.getTrack(OuterEdge.PREV).angle).toBe(Math.PI * 0);
    expect(outerEdge2.configuration.getTrack(OuterEdge.NEXT).angle).toBe(Math.PI);
  });
});

describe("getContractionPoint() for a configuration returns", function () {
  it("2 intersection Points", function () {
    const configurationSetup = createConfigurationSetup(
      new Point(-4, 4),
      new Point(-2, 0),
      new Point(2, 0),
      new Point(1, -2)
    );

    const innerEdge = configurationSetup.innerEdge;
    innerEdge.configuration = new Configuration(innerEdge);
    const pPlus = innerEdge.configuration.getContractionPoint(OuterEdge.PREV);
    const pMinus = innerEdge.configuration.getContractionPoint(OuterEdge.NEXT);

    expect(pPlus.x).toBeCloseTo(-1);
    expect(pPlus.y).toBeCloseTo(-2);
    expect(pMinus.x).toBeCloseTo(4);
    expect(pMinus.y).toBeCloseTo(4);
  });

  it("2 intersection Points", function () {
    const configurationSetup = createConfigurationSetup(
      new Point(-2, 2),
      new Point(-2, 0),
      new Point(2, 0),
      new Point(8, -2)
    );

    const innerEdge = configurationSetup.innerEdge;
    innerEdge.configuration = new Configuration(innerEdge);
    const pPlus = innerEdge.configuration.getContractionPoint(OuterEdge.PREV);
    const pMinus = innerEdge.configuration.getContractionPoint(OuterEdge.NEXT);

    expect(pPlus.x).toBeCloseTo(-2);
    expect(pPlus.y).toBeCloseTo(-2);
    expect(pMinus.x).toBeCloseTo(-2);
    expect(pMinus.y).toBeCloseTo(1.33);
  });

  it("2 intersection Points", function () {
    const configurationSetup = createConfigurationSetup(
      new Point(-2, 2),
      new Point(-2, 0),
      new Point(2, 0),
      new Point(2, -2)
    );

    const innerEdge = configurationSetup.innerEdge;
    innerEdge.configuration = new Configuration(innerEdge);
    const pPlus = innerEdge.configuration.getContractionPoint(OuterEdge.PREV);
    const pMinus = innerEdge.configuration.getContractionPoint(OuterEdge.NEXT);

    expect(pPlus.x).toBeCloseTo(-2);
    expect(pPlus.y).toBeCloseTo(-2);
    expect(pMinus.x).toBeCloseTo(2);
    expect(pMinus.y).toBeCloseTo(2);
  });

  it("2 intersection Points", function () {
    const configurationSetup = createConfigurationSetup(
      new Point(0, 2),
      new Point(-2, 0),
      new Point(2, 0),
      new Point(0, -2)
    );

    const innerEdge = configurationSetup.innerEdge;
    innerEdge.configuration = new Configuration(innerEdge);
    const pPlus = innerEdge.configuration.getContractionPoint(OuterEdge.PREV);
    const pMinus = innerEdge.configuration.getContractionPoint(OuterEdge.NEXT);

    expect(pPlus.x).toBeCloseTo(-4);
    expect(pPlus.y).toBeCloseTo(-2);
    expect(pMinus.x).toBeCloseTo(4);
    expect(pMinus.y).toBeCloseTo(2);
  });
});
