import DCEL from "./lib/dcel/Dcel.mjs";
import { logDCEL, mapFromDCEL } from "./lib/dcel/Utilities.js";

const tests = [
  // 'assets/data/ne_110m_africa_admin0.json',
  // 'assets/data/nuts1-ger-simple.json',
  "assets/data/AUT_adm1.json",
  // 'assets/data/central-austria.json',
  // 'assets/data/square.json',
  // 'assets/data/square-islands.json',
  // 'assets/data/square-hole.json',
  // 'assets/data/triangle-hole.json',
  // 'assets/data/2triangle-adjacent.json',
  // 'assets/data/2plgn.json',
  // 'assets/data/2plgn-adjacent.json',
  "assets/data/2plgn-islands.json",
  // 'assets/data/3plgn.json',
  // 'assets/data/3plgn-complex.json'
];

async function getJSON(path) {
  const response = await fetch(path);
  return response.json();
}

tests.forEach(async (test) => {
  const data = await getJSON(test);
  const name = test.slice(test.lastIndexOf("/") + 1, -5);

  const subdivision = DCEL.buildFromGeoJSON(data);

  // subdivision.getInnerFaces().forEach(f => {
  //     f.edge.getCycle().forEach(e => {
  //         e.bisect()
  //     })
  // })

  // subdivision.getInnerFaces().forEach(f => {
  //     console.log(f)
  //     f.edge.subdivideToThreshold(subdivision.epsilon)
  // })

  mapFromDCEL(subdivision, name);
  logDCEL(subdivision);
});
