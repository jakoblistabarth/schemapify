import fs from "fs";
import path from "path";
import Configuration from "../src/lib/c-oriented-schematization/Configuration";
import Contraction, { ContractionType } from "../src/lib/c-oriented-schematization/Contraction";
import Dcel from "../src/lib/DCEL/Dcel";

describe("isConflicting() returns", function () {
  let dcel: Dcel;
  beforeEach(function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("data/shapes/edge-move-test.json"), "utf8")
    );
    dcel = Dcel.fromGeoJSON(json);
  });

  it("false for 2 non-conflicting contractions.", function () {
    const edgeA = dcel.getHalfEdges()[2];
    const cA = (edgeA.configuration = new Configuration(edgeA));

    const edgeB = dcel.getHalfEdges()[6];
    const cB = (edgeB.configuration = new Configuration(edgeB));

    expect(cA[ContractionType.N]?.isConflicting(cB[ContractionType.P] as Contraction)).toBeFalse();
  });

  it("true for 2 conflicting contractions, due to 2 overlapping Edges.", function () {
    const edgeA = dcel.getHalfEdges()[0];
    const cA = (edgeA.configuration = new Configuration(edgeA));

    const edgeB = dcel.getHalfEdges()[2];
    const cB = (edgeB.configuration = new Configuration(edgeB));

    expect(cA[ContractionType.N]?.isConflicting(cB[ContractionType.N] as Contraction)).toBeTrue();
  });

  it("true for 2 conflicting contractions, due to wrong inflectionType of the overlapping Edge.", function () {
    const edgeA = dcel.getHalfEdges()[0];
    const cA = (edgeA.configuration = new Configuration(edgeA));

    const edgeB = dcel.getHalfEdges()[4];
    const cB = (edgeB.configuration = new Configuration(edgeB));

    const edgeC = dcel.getHalfEdges()[8];
    const cC = (edgeC.configuration = new Configuration(edgeC));

    expect(cA[ContractionType.N]?.isConflicting(cB[ContractionType.N] as Contraction)).toBeTrue();
    expect(cA[ContractionType.N]?.isConflicting(cB[ContractionType.P] as Contraction)).toBeTrue();
    expect(cA[ContractionType.N]?.isConflicting(cC[ContractionType.N] as Contraction)).toBeTrue();
  });
});
