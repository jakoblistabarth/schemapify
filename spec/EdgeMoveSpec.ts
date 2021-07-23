import fs from "fs";
import path from "path";
import Dcel from "../src/lib/Dcel/Dcel";

describe("createConfigurations()", function () {
  it("adds configuration to all edges which are possible candidates for edge moves (which endpoints are of degree 3 or less).", function () {
    const json = JSON.parse(
      fs.readFileSync(path.resolve("data/shapes/aligned-deviating.json"), "utf8")
    );
    const dcel = Dcel.fromGeoJSON(json);
    dcel.schematize();

    const verticesDegree4 = dcel.getVertices().filter((v) => v.edges.length === 4);

    const edgesDegree4 = dcel
      .getHalfEdges()
      .filter((e) => e.getEndpoints().some((v) => v.edges.length > 3));

    expect(verticesDegree4.length).toBe(1);
    expect(edgesDegree4.length).toBe(8);
  });
});
