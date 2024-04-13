import fs from "fs";
import path from "path";
import Dcel from "@/src/DCEL/Dcel";
import CSchematization from "@/src/c-oriented-schematization/CSchematization";

describe("removeSuperfluousVertices()", function () {
  it("on a square-shaped DCEL of with superfluous vertices, results in a DCEL of 4 vertices", function () {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/superfluous-vertices-square.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    const schematization = new CSchematization(dcel);
    schematization.removeSuperfluousVertices();

    expect(dcel.getVertices().length).toBe(4);
  });

  it("on a triangle-shaped DCEL of with superfluous vertices, results in a DCEL of 3 vertices", function () {
    const json = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/shapes/superfluous-vertices-triangle.json"),
        "utf8",
      ),
    );
    const dcel = Dcel.fromGeoJSON(json);
    const schematization = new CSchematization(dcel);
    schematization.removeSuperfluousVertices();

    expect(dcel.getVertices().length).toBe(3);
  });
});
