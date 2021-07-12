import fs from "fs";
import path from "path";
import Dcel from "../src/lib/DCEL/Dcel";
import HalfEdge, { InflectionType } from "../src/lib/DCEL/HalfEdge";
import Vertex from "../src/lib/DCEL/Vertex";

describe("getInteriorAngle", function () {
  it("returns the correct Angles for the reflex point for a dart shape", function () {
    const json = JSON.parse(fs.readFileSync(path.resolve("data/shapes/dart.json"), "utf8"));
    const dcel = Dcel.fromGeoJSON(json);

    const v = dcel.vertices.get("0/1");
    const dartFace = dcel.getBoundedFaces()[0];
    const interior = v.getInteriorAngle(dartFace);
    const exterior = v.getExteriorAngle(dartFace);
    expect(interior).toBeGreaterThan(0);
    expect(exterior).toBeLessThan(0);
    expect(interior + exterior).toBe(Math.PI);
  });

  it("returns the correct Angles for any of the convex points for a dart shape", function () {
    const json = JSON.parse(fs.readFileSync(path.resolve("data/shapes/dart.json"), "utf8"));
    const dcel = Dcel.fromGeoJSON(json);

    const v = dcel.vertices.get("2/2");
    const dartFace = dcel.getBoundedFaces()[0];
    const interior = v.getInteriorAngle(dartFace);
    const exterior = v.getExteriorAngle(dartFace);
    expect(exterior).toBeGreaterThan(0);
    expect(interior).toBeGreaterThan(0);
    expect(interior + exterior).toBe(Math.PI);
  });
});

xdescribe("getInflectionType()", function () {
  it("returns the correct Inflection type", function () {
    const A = new Vertex(2, 2, undefined);
    const B = new Vertex(0, 0, undefined);
    const C = new Vertex(2, -4, undefined);
    const D = new Vertex(4, -3, undefined);
    const E = new Vertex(6, -4, undefined);
    const F = new Vertex(5, -6, undefined);
    const a = new HalfEdge(A, undefined);
    a.twin = new HalfEdge(B, undefined);
    const b = new HalfEdge(B, undefined);
    b.twin = new HalfEdge(C, undefined);
    const c = new HalfEdge(C, undefined);
    c.twin = new HalfEdge(D, undefined);
    const d = new HalfEdge(D, undefined);
    d.twin = new HalfEdge(E, undefined);
    const e = new HalfEdge(E, undefined);
    e.twin = new HalfEdge(F, undefined);

    a.next = b;
    b.next = c;
    c.next = d;
    d.next = e;

    b.prev = a;
    c.prev = b;
    d.prev = c;
    e.prev = d;

    expect(b.getInflectionType()).toBe(InflectionType.C);
    // expect(c.getInflectionType()).toBe(InflectionType.B);
    // expect(d.getInflectionType()).toBe(InflectionType.R);
  });
});
