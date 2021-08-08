import fs from "fs";
import path from "path";
import Dcel from "../src/lib/DCEL/Dcel";
import FaceFaceBoundaryList from "../src/lib/c-oriented-schematization/FaceFaceBoundaryList";

describe("doEdgeMove()", function () {
  it("modifies a dcel …", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("data/shapes/smallest-contraction.json"), "utf8")
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel.faceFaceBoundaryList = new FaceFaceBoundaryList(dcel);
    dcel.createConfigurations();
    const pair = dcel.faceFaceBoundaryList.getBoundaries()[0].getMinimalConfigurationPair();
    pair?.doEdgeMove();

    expect(dcel.getBoundedFaces()[0].getEdges()[4].toString()).toBe("10/7->10/8");
    expect(dcel.getBoundedFaces()[0].getEdges()[5].toString()).toBe("10/8->9.75/8");
    expect(dcel.getBoundedFaces()[0].getEdges()[6].toString()).toBe("9.75/8->9.75/10");
  });
});
