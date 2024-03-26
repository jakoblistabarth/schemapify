import fs from "fs";
import path from "path";
import Dcel from "@/src/DCEL/Dcel";
import FaceFaceBoundaryList from "@/src/c-oriented-schematization/FaceFaceBoundaryList";

describe("getMinimalConfigurationPair() finds the expected pair", function () {
  xit("for the test case 'smallest-contraction", function () {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/smallest-contraction.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel.createConfigurations();
    dcel.faceFaceBoundaryList = new FaceFaceBoundaryList(dcel);
    const pair = dcel.faceFaceBoundaryList.getMinimalConfigurationPair();
    const contractionEdge =
      pair?.contraction.configuration.innerEdge.toString();
    const compensationEdge =
      pair?.compensation?.configuration.innerEdge.toString();

    expect(contractionEdge).toEqual("9.5/7->9.5/8");
    expect(compensationEdge).toEqual("11/0->11/1");
    expect(pair?.contraction.area).toEqual(0.5);
  });

  xit("for the test case 'smallest-contraction-2", function () {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/smallest-contraction-2.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel.createConfigurations();
    dcel.faceFaceBoundaryList = new FaceFaceBoundaryList(dcel);
    const pair = dcel.faceFaceBoundaryList.getMinimalConfigurationPair();
    const contractionEdge =
      pair?.contraction.configuration.innerEdge.toString();
    const compensationEdge =
      pair?.compensation?.configuration.innerEdge.toString();

    expect(contractionEdge).toEqual("10.5/7->10.5/8");
    expect(compensationEdge).toEqual("9/2->9/3");
    expect(pair?.contraction.area).toEqual(0.5);
  });
});

describe("recursive doEdgeMove() on minimal configuration pairs", function () {
  xit("returns the expected contraction pair for the second, third, and fourth edge move.", function () {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/smallest-contraction.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel.createConfigurations();
    dcel.faceFaceBoundaryList = new FaceFaceBoundaryList(dcel);
    const contractionEdges: string[] = [];

    for (let index = 0; index < 10; index++) {
      const pair = dcel.faceFaceBoundaryList.getMinimalConfigurationPair();
      const contractionEdge = pair?.contraction.configuration.innerEdge;
      if (contractionEdge)
        contractionEdges.push(contractionEdge?.toString() as string);
      pair?.doEdgeMove();
    }
    expect(contractionEdges).toEqual([
      "9.5/7->9.5/8",
      "10/1->10/7",
      "10/8->10/10",
    ]);
  });
});
