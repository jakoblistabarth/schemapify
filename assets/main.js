import DCEL from "./lib/dcel/Dcel.mjs";
import { logDCEL, mapFromDCEL } from "./lib/dcel/Utilities.mjs";

const tests = [
  // "assets/data/geodata/ne_110m_africa_admin0.json",
  // "assets/data/geodata/AUT_adm1.json",
  // "assets/data/geodata/central-austria.json",
  // "assets/data/shapes/triangle.json",
  // "assets/data/shapes/enclave.json",
  // "assets/data/shapes/enclave2.json",
  // "assets/data/shapes/triangle-hole.json",
  // "assets/data/shapes/2triangle-adjacent.json",
  // "assets/data/shapes/square.json",
  // "assets/data/shapes/square-islands.json",
  // "assets/data/shapes/square-hole.json",
  // "assets/data/shapes/square-hole-island.json",
  // "assets/data/shapes/square-hole-island-hole.json",
  // "assets/data/shapes/2plgn.json",
  // "assets/data/shapes/2plgn-adjacent.json",
  // "assets/data/shapes/2plgn-islands.json",
  // "assets/data/shapes/2plgn-islands-hole.json",
  // "assets/data/shapes/2plgn-islands-holes.json",
  // "assets/data/shapes/3plgn.json",
  // "assets/data/shapes/3plgn-complex.json",
  "assets/data/shapes/edge-cases.json",
];

async function getJSON(path) {
  const response = await fetch(path);
  return response.json();
}

tests.forEach(async (test) => {
  const data = await getJSON(test);
  const name = test.slice(test.lastIndexOf("/") + 1, -5);
  const subdivision = DCEL.buildFromGeoJSON(data);
  subdivision.splitEdges();

  logDCEL(subdivision, name);
  mapFromDCEL(subdivision, name + "_bisect");
});
