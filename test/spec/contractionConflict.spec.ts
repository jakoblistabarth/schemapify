import Configuration from "@/src/c-oriented-schematization/Configuration";
import CRegular from "@/src/c-oriented-schematization/CRegular";
import CSchematization from "@/src/c-oriented-schematization/CSchematization";
import ConfigurationGenerator from "@/src/c-oriented-schematization/ConfigurationGenerator";
import { ContractionType } from "@/src/c-oriented-schematization/ContractionType";
import { style } from "@/src/c-oriented-schematization/schematization.style";
import Dcel from "@/src/Dcel/Dcel";
import fs from "fs";
import path from "path";
import { describe, expect, test } from "vitest";

/**
 * Reads a shape and builds a {@link Configuration} for each of its half edges.
 * @param shape The name of a shape in `test/data/shapes`.
 * @returns The configurations.
 */
const getConfigurations = (shape: string) => {
  const json = JSON.parse(
    fs.readFileSync(path.resolve("test/data/shapes", shape), "utf8"),
  );
  return Array.from(
    new ConfigurationGenerator().run(Dcel.fromGeoJSON(json)).values(),
  );
};

/**
 * Finds the pairs of configurations which lie on opposite sides of one edge: the edge
 * is the inner edge of one and an outer edge of the other, which hold it as a half
 * edge and its twin respectively.
 * @param configurations The configurations to pair up.
 * @returns The pairs, the first configuration being the one holding the edge as outer.
 */
const getPairsAcrossOneEdge = (configurations: Configuration[]) =>
  configurations.flatMap((outer) =>
    configurations
      .filter(
        (inner) =>
          inner !== outer &&
          [outer.x[0], outer.x[2]].some(
            (edge) => edge?.twin === inner.innerEdge,
          ),
      )
      .map((inner) => [outer, inner] as const),
  );

describe("Contractions of two configurations across one edge", function () {
  test("are recognised as sharing that edge", function () {
    const pairs = getPairsAcrossOneEdge(getConfigurations("2plgn.json"));
    expect(pairs.length).toBeGreaterThan(0);

    const [outer, inner] = pairs[0];
    const outerContraction =
      outer[ContractionType.P] ?? outer[ContractionType.N];
    const innerContraction =
      inner[ContractionType.P] ?? inner[ContractionType.N];
    if (!outerContraction || !innerContraction)
      throw new Error("both configurations need a contraction");

    expect(
      outerContraction.getOverlappingEdges(innerContraction).length,
    ).toBeGreaterThan(0);
  });

  test.each(["2plgn.json", "3plgn-adjacent.json", "aligned-deviating.json"])(
    "conflict, since contracting one consumes the other's inner edge (%s)",
    function (shape) {
      const pairs = getPairsAcrossOneEdge(getConfigurations(shape));
      expect(pairs.length).toBeGreaterThan(0);

      const conflicting = pairs.map(([outer, inner]) => {
        const a = outer[ContractionType.P] ?? outer[ContractionType.N];
        const b = inner[ContractionType.P] ?? inner[ContractionType.N];
        return a && b ? a.isConflicting(b) : undefined;
      });

      expect(conflicting.filter((d) => d !== undefined)).not.toContain(false);
    },
  );
});

describe("A compensation which takes on exactly the area asked of it", function () {
  test.each([
    ["collinear-vertices-square.json", 3],
    ["edge-cases.json", 6],
  ])(
    "shrinks its inner edge to a point rather than failing (%s, C(%i))",
    function (shape, orientations) {
      // Both areas being equal puts the discriminant of the compensation's height at
      // zero, which coordinates round to just below it.
      const json = JSON.parse(
        fs.readFileSync(path.resolve("test/data/shapes", shape), "utf8"),
      );
      const schematization = new CSchematization({
        ...style,
        c: new CRegular(orientations),
      });

      expect(() => schematization.run(Dcel.fromGeoJSON(json))).not.toThrow();
    },
  );
});
