import fs from "fs";
import path from "path";
import Configuration, { OuterEdge } from "../src/lib/c-oriented-schematization/Configuration";
import Dcel from "../src/lib/DCEL/Dcel";

describe("getTrack()", function () {
  it("return the correct angles for the reflex point for a square shape", function () {
    const json = JSON.parse(fs.readFileSync(path.resolve("data/shapes/square.json"), "utf8"));
    const dcel = Dcel.fromGeoJSON(json);

    const outerEdge1 = dcel.getBoundedFaces()[0].edge;
    outerEdge1.configuration = new Configuration(outerEdge1);
    const outerEdge2 = outerEdge1.next;
    outerEdge2.configuration = new Configuration(outerEdge2);

    expect(outerEdge1.configuration.getTrack(OuterEdge.PREV).angle).toBe(Math.PI * 1.5);
    expect(outerEdge1.configuration.getTrack(OuterEdge.NEXT).angle).toBe(Math.PI * 0.5);
    expect(outerEdge2.configuration.getTrack(OuterEdge.PREV).angle).toBe(Math.PI * 0);
    expect(outerEdge2.configuration.getTrack(OuterEdge.NEXT).angle).toBe(Math.PI);
  });
});
