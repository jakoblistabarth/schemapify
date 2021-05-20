import DCEL from "./lib/dcel/Dcel.mjs";
import { logDCEL, mapFromDCEL } from "./lib/dcel/Utilities.mjs";
import { DCELtoGeoJSON } from "./lib/dcel/DCELtoGeoJSON.mjs";

const tests = [
  // "assets/data/geodata/ne_110m_africa_admin0.json",
  // "assets/data/geodata/AUT_adm1.json",
  // "assets/data/geodata/central-austria.json",
  // "assets/data/shapes/triangle.json",
  // "assets/data/shapes/triangle-hole.json",
  // "assets/data/shapes/2triangle-adjacent.json",
  "assets/data/shapes/square.json",
  // "assets/data/shapes/square-islands.json",
  "assets/data/shapes/square-hole.json",
  // "assets/data/shapes/2plgn.json",
  // "assets/data/shapes/2plgn-adjacent.json",
  // "assets/data/shapes/2plgn-islands.json",
  // "assets/data/shapes/2plgn-islands-hole.json",
  // "assets/data/shapes/3plgn.json",
  // "assets/data/shapes/3plgn-complex.json",
];

async function getJSON(path) {
  const response = await fetch(path);
  return response.json();
}

tests.forEach(async (test) => {
  const data = await getJSON(test);
  const name = test.slice(test.lastIndexOf("/") + 1, -5);

  const subdivision = DCEL.buildFromGeoJSON(data);

  const e = subdivision
    .getBoundedFaces()
    [subdivision.getBoundedFaces().length - 1].edge.getCycle()[0];

  // console.log("unboundedFace", subdivision.getUnboundedFace());
  // console.log("e", e);
  // console.log("e.face", e.face);
  // console.log("e.twin.face", e.twin.face);

  mapFromDCEL(subdivision, name);
  logDCEL(subdivision);

  // e.bisect();

  // subdivision.getBoundedFaces().forEach((f) => {
  //   f.getEdges().forEach((e) => {
  //     console.log(e.tail, e.face.uuid);
  //   });
  // });

  // subdivision.getBoundedFaces().forEach((f) => {
  //   f.getEdges()
  //     .slice(0, 1)
  //     .forEach((e) => e.subdivideToThreshold(subdivision.epsilon));
  // });

  // logDCEL(subdivision);
  // mapFromDCEL(subdivision, name + "_bisect");
});
