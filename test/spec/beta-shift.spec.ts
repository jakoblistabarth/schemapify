import { isAlignedToC } from "@/src/c-oriented-schematization/HalfEdgeUtils";
import { CStyle } from "@/src/c-oriented-schematization/schematization.style";
import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, test } from "vitest";
import Dcel from "../../src/Dcel/Dcel";
import CRegular from "../../src/c-oriented-schematization/CRegular";
import CSchematization from "../../src/c-oriented-schematization/CSchematization";

describe("Beta shift for schematization using a regular C", function () {
  const c = new CRegular(2, Math.PI / 2);
  const cStyle = {
    lambda: 1,
    k: 3,
    c,
    staircaseEpsilon: 0.1,
  } satisfies CStyle;

  test("should simplify without throwing an error", function () {
    const inputJson = JSON.parse(
      readFileSync(resolve("test/data/shapes/triangle.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(inputJson);
    const schematization = new CSchematization(cStyle);

    expect(() => schematization.run(dcel, 1)).not.toThrow();
  });

  test("should keep all constrained edges aligned to shifted C", function () {
    const inputJson = JSON.parse(
      readFileSync(resolve("test/data/shapes/triangle.json"), "utf8"),
    );
    const dcel = Dcel.fromGeoJSON(inputJson);
    const schematization = new CSchematization(cStyle);

    const constrained = schematization.constrainAngles(
      schematization.preProcess(dcel),
    );
    const halfEdges = constrained.getHalfEdges(true);
    const misaligned = halfEdges.filter((edge) => {
      return typeof edge.getAngle() === "number" && !isAlignedToC(edge, c);
    });

    expect(
      misaligned.map(
        (edge) =>
          `${edge.tail.x}|${edge.tail.y}->${edge.head?.x}|${edge.head?.y}`,
      ),
    ).toEqual([]);
  });
});
