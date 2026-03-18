import CSchematization from "@/src/c-oriented-schematization/CSchematization";
import { describe, test } from "vitest";
import { getTestFiles } from "./test-setup";
import { readFileSync } from "fs";
import { resolve } from "path";
import Dcel from "@/src/Dcel/Dcel";

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
