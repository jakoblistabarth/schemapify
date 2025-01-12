import Dcel from "@/src/Dcel/Dcel";
import fs from "fs";
import path from "path";

describe("A Dcel clone", function () {
  let dcel: Dcel;
  let clone: Dcel;

  beforeEach(function () {
    const polygon = JSON.parse(
      fs.readFileSync(
        path.resolve("test/data/geodata/AUT_adm1-simple.json"),
        "utf8",
      ),
    );
    dcel = Dcel.fromGeoJSON(polygon);
    clone = dcel.clone();
  });

  it("is a different object.", function () {
    expect(dcel).not.toBe(clone);
  });

  it("has the same faces.", function () {
    expect(dcel.getBoundedFaces().map((f) => f.uuid)).toStrictEqual(
      clone.getBoundedFaces().map((f) => f.uuid),
    );
  });
  it("has the same edges.", function () {
    expect(dcel.getHalfEdges().map((e) => e.uuid)).toStrictEqual(
      clone.getHalfEdges().map((e) => e.uuid),
    );
  });
  it("has the same vertices.", function () {
    expect(dcel.getVertices().map((v) => v.uuid)).toStrictEqual(
      clone.getVertices().map((v) => v.uuid),
    );
  });
});
