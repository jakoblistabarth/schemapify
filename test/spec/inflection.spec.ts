import Dcel from "@/src/Dcel/Dcel";
import { InflectionType } from "@/src/Dcel/HalfEdge";
import Point from "@/src/geometry/Point";
import fs from "fs";
import path from "path";
import { describe, expect, test } from "vitest";
import { createConfigurationSetup } from "./test-setup";

describe("getInteriorAngle() and getExteriorAngle()", function () {
  test("return the correct angles for the reflex point for a dart shape", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/dart.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);

    const v = dcel.findVertex(0, 1);
    const dartFace = dcel.getBoundedFaces()[0];
    const interior = v?.getInteriorAngle(dartFace) as number;
    const exterior = v?.getExteriorAngle(dartFace) as number;
    expect(interior).toBeGreaterThan(0);
    expect(exterior).toBeLessThan(0);
    expect(interior + exterior).toBe(Math.PI);
  });

  test("return the correct angles for any of the convex points for a dart shape", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/dart.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);

    const v = dcel.findVertex(2, 2);
    const dartFace = dcel.getBoundedFaces()[0];
    const interior = v?.getInteriorAngle(dartFace) as number;
    const exterior = v?.getExteriorAngle(dartFace) as number;
    expect(exterior).toBeGreaterThan(0);
    expect(interior).toBeGreaterThan(0);
    expect(interior + exterior).toBe(Math.PI);
  });
});

describe("getInflectionType()", function () {
  test("returns the correct inflection type", function () {
    const dcel = new Dcel();
    const A = dcel.addVertex(2, 2);
    const B = dcel.addVertex(0, 0);
    const C = dcel.addVertex(2, -4);
    const D = dcel.addVertex(4, -3);
    const E = dcel.addVertex(6, -4);
    const F = dcel.addVertex(5, -6);

    const a = dcel.addHalfEdge(A, B);
    const aTwin = dcel.addHalfEdge(B, A);
    a.twin = aTwin;
    aTwin.twin = a;

    const b = dcel.addHalfEdge(B, C);
    const bTwin = dcel.addHalfEdge(C, B);
    b.twin = bTwin;
    bTwin.twin = b;

    const c = dcel.addHalfEdge(C, D);
    const cTwin = dcel.addHalfEdge(D, C);
    c.twin = cTwin;
    cTwin.twin = c;

    const d = dcel.addHalfEdge(D, E);
    const dTwin = dcel.addHalfEdge(E, D);
    d.twin = dTwin;
    dTwin.twin = d;

    const e = dcel.addHalfEdge(E, F);
    const eTwin = dcel.addHalfEdge(F, E);
    e.twin = eTwin;
    eTwin.twin = e;

    a.next = b;
    b.next = c;
    c.next = d;
    d.next = e;

    b.prev = a;
    c.prev = b;
    d.prev = c;
    e.prev = d;

    B.edges = [a.twin, b];
    C.edges = [b.twin, c];
    D.edges = [c.twin, d];
    E.edges = [d.twin, e];

    const fface = dcel.addFace();
    a.face = b.face = c.face = e.face = d.face = fface;

    expect(b.getInflectionType()).toBe(InflectionType.C);
    expect(c.getInflectionType()).toBe(InflectionType.B);
    expect(d.getInflectionType()).toBe(InflectionType.R);
  });

  test("returns the correct inflection type on a v-shape", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/v-shape.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);

    const outerEdges = dcel.getBoundedFaces()[0].getEdges();
    const types = outerEdges.map((edge) => edge.getInflectionType());
    expect(types).toEqual([
      InflectionType.C,
      InflectionType.C,
      InflectionType.B,
      InflectionType.R,
      InflectionType.B,
      InflectionType.C,
    ]);
  });

  test("returns the correct inflection type on the irregular shape give in the paper by Buchin et al.", function () {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/inflection-test.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);

    const outerEdges = dcel.getBoundedFaces()[0].getEdges();
    const types = outerEdges.map((edge) => edge.getInflectionType());
    expect(types).toEqual([
      InflectionType.B,
      InflectionType.R,
      InflectionType.B,
      InflectionType.C,
      InflectionType.B,
      InflectionType.R,
      InflectionType.B,
      InflectionType.C,
      InflectionType.C,
    ]);
  });
});

describe("getInflectionType() on the inner edge of a configuration Setup", function () {
  test("where the endpoints of the inner edge are both, reflex and convex", function () {
    const configurationSetup = createConfigurationSetup(
      new Point(-4, 4),
      new Point(-2, 0),
      new Point(2, 0),
      new Point(1, -2),
      [new Point(8, 5)],
    );
    expect(configurationSetup.innerEdge.getInflectionType()).toBe(
      InflectionType.B,
    );
  });

  test("where the endpoints of the inner edge are both convex", function () {
    const configurationSetup = createConfigurationSetup(
      new Point(-4, 4),
      new Point(-2, 0),
      new Point(2, 0),
      new Point(2, 2),
      [new Point(8, 5)],
    );
    expect(configurationSetup.innerEdge.getInflectionType()).toBe(
      InflectionType.C,
    );
  });

  test("where the endpoints of the inner edge are both reflex", function () {
    const configurationSetup = createConfigurationSetup(
      new Point(-4, -2),
      new Point(-2, 0),
      new Point(2, 0),
      new Point(4, -2),
      [new Point(0, 6)],
    );
    expect(configurationSetup.innerEdge.getInflectionType()).toBe(
      InflectionType.R,
    );
  });
});
