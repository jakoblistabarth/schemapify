import Dcel from "@/src/Dcel/Dcel";
import Face from "@/src/Dcel/Face";
import CSchematization from "@/src/c-oriented-schematization/CSchematization";
import { style } from "@/src/c-oriented-schematization/schematization.style";
import { geoPackageToGeometry } from "@/src/Input/geoPackage";
import Point from "@/src/geometry/Point";
import fs from "fs";
import path from "path";
import { beforeEach, describe, expect, test } from "vitest";

const fromShape = (name: string) =>
  Dcel.fromGeoJSON(
    JSON.parse(
      fs.readFileSync(path.resolve(`test/data/shapes/${name}.json`), "utf8"),
    ),
  );

describe.each(["enclave", "enclave2"])(
  "Subdividing a half-edge on the hole boundary of %s.json",
  (shape) => {
    let dcel: Dcel;
    let enclosing: Face;
    /** The midpoint of the hole's bottom edge, which runs from (0.5, 0.5) to (1.5, 0.5). */
    const midpoint = new Point(1, 0.5);

    /** The number of rings of the polygon which has the hole. */
    const ringCounts = () =>
      dcel
        .toSubdivision()
        .multiPolygons.flatMap((mp) => mp.polygons.map((p) => p.rings.length));

    beforeEach(() => {
      dcel = fromShape(shape);
      const face = dcel.getBoundedFaces().find((f) => f.innerEdges.length > 0);
      if (!face) throw new Error("no face with a hole");
      enclosing = face;
    });

    test("keeps the hole when the registered (hole-side) half-edge is subdivided", () => {
      const innerEdge = enclosing.innerEdges[0];
      const holeFace = innerEdge.face;
      innerEdge.subdivide(midpoint);

      expect(enclosing.innerEdges.length).toBe(1);
      expect(enclosing.innerEdges[0].face).toBe(holeFace);
      expect(ringCounts().sort()).toEqual([1, 2]);
    });

    test("keeps the hole when the twin of the registered half-edge is subdivided", () => {
      const innerEdge = enclosing.innerEdges[0];
      const holeFace = innerEdge.face;
      innerEdge.twin?.subdivide(midpoint);

      expect(enclosing.innerEdges.length).toBe(1);
      expect(enclosing.innerEdges[0].face).toBe(holeFace);
      expect(ringCounts().sort()).toEqual([1, 2]);
    });
  },
);

describe("Schematizing real-world geodata with an enclave", () => {
  test("preserves the enclave's hole through the staircase step", async () => {
    const { data } = await geoPackageToGeometry(
      new Uint8Array(
        fs.readFileSync(path.join("test/data/gpkg", "AUT_adm1-31287.gpkg")),
      ),
    );
    const schematization = new CSchematization({ ...style });
    const preProcessed = schematization.preProcess(Dcel.fromSubdivision(data));
    const before = preProcessed.toSubdivision();
    const ringsBefore = before.multiPolygons.map((mp) =>
      mp.polygons.map((p) => p.rings.length),
    );
    const areaBefore = before.multiPolygons.reduce(
      (acc, mp) => acc + mp.area,
      0,
    );

    const after = schematization.constrainAngles(preProcessed).toSubdivision();

    // Niederösterreich keeps its hole; Wien no longer overlaps it.
    expect(
      after.multiPolygons.map((mp) => mp.polygons.map((p) => p.rings.length)),
    ).toEqual(ringsBefore);
    expect(
      after.multiPolygons.reduce((acc, mp) => acc + mp.area, 0),
    ).toBeCloseTo(areaBefore, -3);
  }, 60_000);
});
