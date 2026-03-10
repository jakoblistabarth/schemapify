import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import Dcel from "@/src/Dcel/Dcel";
import ConfigurationGenerator from "@/src/c-oriented-schematization/ConfigurationGenerator";
import FaceFaceBoundaryListGenerator from "@/src/c-oriented-schematization/FaceFaceBoundaryListGenerator";

describe("A ConfigurationPair with overlapping configurations", function () {
  it("ConfigurationPairs with an shared outer Edge are identified.", function () {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/smallest-contraction.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    const configurations = new ConfigurationGenerator().run(dcel);
    const ffbList = new FaceFaceBoundaryListGenerator().run(dcel);

    const pair = ffbList.getMinimalConfigurationPair(configurations);

    if (!pair) return;

    expect(pair.contraction.configuration.innerEdge.coordKey).toEqual(
      "9.5|7->9.5|8",
    );
    expect(pair.compensation.configuration.innerEdge.coordKey).toEqual(
      "10|8->10|10",
    );
    expect(pair.isSharingEdge()).toBe(true);
  });
});
