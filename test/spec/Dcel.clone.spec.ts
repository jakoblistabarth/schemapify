import Dcel from "@/src/Dcel/Dcel";
import { readFileSync } from "fs";
import { resolve } from "path";
import { beforeEach, describe, expect, test } from "vitest";

describe("A Dcel clone", function () {
  let dcel: Dcel;
  let clone: Dcel;

  beforeEach(function () {
    const polygon = JSON.parse(
      readFileSync(resolve("test/data/geodata/AUT_adm1-simple.json"), "utf8"),
    );
    dcel = Dcel.fromGeoJSON(polygon);
    clone = dcel.clone();
  });

  test("is independent from the original.", () => {
    const originalFaceCount = dcel.getBoundedFaces().length;
    // Remove a face from the clone
    clone.faces.splice(0, 1);
    // Original should be unaffected
    expect(dcel.getBoundedFaces().length).toBe(originalFaceCount);
  });

  test("has the same faces.", function () {
    expect(dcel.getBoundedFaces().map((f) => f.uuid)).toStrictEqual(
      clone.getBoundedFaces().map((f) => f.uuid),
    );
  });
  test("has the same edges.", function () {
    expect(dcel.getHalfEdges().map((e) => e.uuid)).toStrictEqual(
      clone.getHalfEdges().map((e) => e.uuid),
    );
  });
  test("has the same vertices.", function () {
    expect(dcel.getVertices().map((v) => v.uuid)).toStrictEqual(
      clone.getVertices().map((v) => v.uuid),
    );
  });
});
