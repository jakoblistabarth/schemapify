import { readdirSync } from "fs";

export function getTestFiles(dir) {
  const filesInDir = readdirSync(dir, function (err, files) {
    if (err) {
      return console.log("Unable to scan directory: " + err);
    }
    return files;
  });

  return filesInDir.filter((f) => f.substr(-5, f.length) === ".json");
}

export function checkIfEntitiesComplete(dcel) {
  it("vertices", function () {
    const vertices = Object.values(dcel.vertices).map((vertex) =>
      Object.values(vertex).every((x) => typeof x !== "undefined")
    );
    expect(vertices).not.toContain(false);
  });

  it("halfEdges", function () {
    const halfEdges = dcel.halfEdges.map((halfEdge) =>
      Object.values(halfEdge).every((x) => typeof x !== "undefined")
    );
    expect(halfEdges).not.toContain(false);
  });

  it("faces", function () {
    const faces = dcel.faces.map((face) =>
      Object.values(face).every((x) => typeof x !== "undefined")
    );
    expect(faces).not.toContain(false);
  });

  it("outerface", function () {
    const outerFace = Object.values(dcel.outerFace).every((x) => typeof x !== "undefined");
    expect(outerFace).not.toContain(false);
  });
}
