import CRegular from "@/src/c-oriented-schematization/CRegular";
import CSchematization from "@/src/c-oriented-schematization/CSchematization";
import { style } from "@/src/c-oriented-schematization/schematization.style";
import Dcel from "@/src/Dcel/Dcel";
import { EPSILON } from "@/src/geometry/constants";
import Input from "@/src/Input/Input";
import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, test } from "vitest";
import { getTestFiles } from "./test-setup";

describe(
  "CSchematization's run() method does not throw.",
  { timeout: 20_000 },
  function () {
    test("CSchematization's run() method does not throw on simplified boundaries of Austria.", function () {
      const inputJson = JSON.parse(
        readFileSync(resolve("test/data/geodata/AUT_adm1-simple.json"), "utf8"),
      );
      const dcel = Dcel.fromGeoJSON(inputJson);
      const schematization = new CSchematization();
      schematization.run(dcel);
    });

    describe("For synthetic data", function () {
      const dir = "test/data/shapes";
      const testFiles = getTestFiles(dir, true);

      testFiles
        .filter((file) => file.match(/smallest-contraction/))
        .forEach((file) => {
          test(
            "Running schematization on " + file + " does not throw",
            function () {
              const inputJson = JSON.parse(
                readFileSync(resolve(dir + "/" + file), "utf8"),
              );
              const dcel = Dcel.fromGeoJSON(inputJson);
              const schematization = new CSchematization();
              schematization.run(dcel);
            },
          );
        });
    });
  },
);

describe("Schematizing projected geodata", { timeout: 60_000 }, function () {
  /**
   * Finds vertices with two incident edges of the same direction, which means the
   * two edges overlap and the boundary doubles back on itself.
   * @param dcel The {@link Dcel} to check.
   * @returns A description of every offending vertex.
   */
  const findOverlappingEdges = (dcel: Dcel) =>
    dcel.getVertices().flatMap((vertex) => {
      const angles = vertex.edges.map((edge) => edge.getAngle());
      const hasDuplicate = angles.some(
        (angle, index) =>
          angle !== undefined &&
          angles.findIndex(
            (other) => other !== undefined && Math.abs(other - angle) < EPSILON,
          ) !== index,
      );
      return hasDuplicate ? [`(${vertex.x}, ${vertex.y})`] : [];
    });

  /**
   * Schematizes Germany's states, whose coordinates in the millions are what made
   * several tolerances too coarse to hold.
   * @param orientations The number of orientations of C.
   * @returns The schematized {@link Dcel} and the area it started from.
   */
  const schematizeGermany = async (orientations: number) => {
    const bytes = new Uint8Array(
      readFileSync(resolve("test/data/generated/DEU_adm1-s0.01.gpkg")),
    );
    const input = await Input.fromGeoPackage("DEU", bytes);
    const schematization = new CSchematization({
      ...style,
      c: new CRegular(orientations),
    });
    const originalArea = input.getDcel().getArea();

    return { result: schematization.run(input.getDcel()), originalArea };
  };

  test.each([3, 6])(
    "preserves the area of Germany's states under C(%i)",
    async function (orientations) {
      const { result, originalArea } = await schematizeGermany(orientations);

      // Relative, since an area of 3.4e11 accumulates rounding over a hundred odd
      // moves which no absolute tolerance can be stated for. Under C(3) a single
      // regular move, meeting no junction, accounts for nearly all of what is left.
      expect(
        Math.abs(result.getArea() - originalArea) / originalArea,
      ).toBeLessThan(2e-8);
    },
  );

  test("leaves the boundaries free of overlaps under C(3)", async function () {
    const { result } = await schematizeGermany(3);

    expect(findOverlappingEdges(result)).toEqual([]);
  });

  test("leaves the boundaries free of overlaps under C(6)", async function () {
    const { result } = await schematizeGermany(6);

    expect(findOverlappingEdges(result)).toEqual([]);
  });
});
