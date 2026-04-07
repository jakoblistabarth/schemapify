import { describe, expect, test } from "vitest";
import Dcel from "@/src/Dcel/Dcel";
import CSchematization from "@/src/c-oriented-schematization/CSchematization";
import fs from "fs";
import path from "path";
import ConfigurationGenerator from "@/src/c-oriented-schematization/ConfigurationGenerator";
import FaceFaceBoundaryListGenerator from "@/src/c-oriented-schematization/FaceFaceBoundaryListGenerator";

describe("v-shape.json - invalid configurations chosen", function () {
  const json = JSON.parse(
    fs.readFileSync(path.resolve("test/data/shapes/v-shape.json"), "utf8"),
  );

  test("Check geometry after 14 edge moves iterations", function () {
    const result = new CSchematization().run(Dcel.fromGeoJSON(json), 14);
    const configurations = new ConfigurationGenerator().run(result);
    const ffb = new FaceFaceBoundaryListGenerator().run(result);
    const pair = ffb.getMinimalConfigurationPair(configurations);
    const contractionEdge = pair?.contraction.configuration.innerEdge.coordKey;
    expect(contractionEdge).not.toBe(
      "-1.625|1.527777777781482->-1.625|1.9583333333",
    ); // This edge should not be contracted as it would create a degenerate face
  });
});
