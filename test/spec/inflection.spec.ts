import fs from "fs";
import path from "path";
import Point from "@/src/geometry/Point";
import Face from "@/src/Dcel/Face";
import Dcel from "@/src/Dcel/Dcel";
import HalfEdge, { InflectionType } from "@/src/Dcel/HalfEdge";
import Vertex from "@/src/Dcel/Vertex";
import { createConfigurationSetup } from "./test-setup";

describe("getInteriorAngle() and getExteriorAngle()", function () {
  it("return the correct angles for the reflex point for a dart shape", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/dart.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);

    const v = dcel.vertices.get("0/1");
    const dartFace = dcel.getBoundedFaces()[0];
    const interior = v?.getInteriorAngle(dartFace) as number;
    const exterior = v?.getExteriorAngle(dartFace) as number;
    expect(interior).toBeGreaterThan(0);
    expect(exterior).toBeLessThan(0);
    expect(interior + exterior).toBe(Math.PI);
  });

  it("return the correct angles for any of the convex points for a dart shape", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("test/data/shapes/dart.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(json);

    const v = dcel.vertices.get("2/2");
    const dartFace = dcel.getBoundedFaces()[0];
    const interior = v?.getInteriorAngle(dartFace) as number;
    const exterior = v?.getExteriorAngle(dartFace) as number;
    expect(exterior).toBeGreaterThan(0);
    expect(interior).toBeGreaterThan(0);
    expect(interior + exterior).toBe(Math.PI);
  });
});

describe("getInflectionType()", function () {
  it("returns the correct inflection type", function () {
    const A = new Vertex(2, 2, new Dcel());
    const B = new Vertex(0, 0, new Dcel());
    const C = new Vertex(2, -4, new Dcel());
    const D = new Vertex(4, -3, new Dcel());
    const E = new Vertex(6, -4, new Dcel());
    const F = new Vertex(5, -6, new Dcel());

    const a = new HalfEdge(A, new Dcel());
    a.twin = new HalfEdge(B, new Dcel());
    const b = new HalfEdge(B, new Dcel());
    b.twin = new HalfEdge(C, new Dcel());
    const c = new HalfEdge(C, new Dcel());
    c.twin = new HalfEdge(D, new Dcel());
    const d = new HalfEdge(D, new Dcel());
    d.twin = new HalfEdge(E, new Dcel());
    const e = new HalfEdge(E, new Dcel());
    e.twin = new HalfEdge(F, new Dcel());

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

    a.face = b.face = c.face = e.face = d.face = e.face = new Face();

    expect(b.getInflectionType()).toBe(InflectionType.C);
    expect(c.getInflectionType()).toBe(InflectionType.B);
    expect(d.getInflectionType()).toBe(InflectionType.R);
  });

  it("returns the correct inflection type on a v-shape", function () {
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

  it("returns the correct inflection type on the irregular shape give in the paper by Buchin et al.", function () {
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
  it("where the endpoints of the inner edge are both, reflex and convex", function () {
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

  it("where the endpoints of the inner edge are both convex", function () {
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

  it("where the endpoints of the inner edge are both reflex", function () {
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
