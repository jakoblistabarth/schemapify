import Dcel from "./lib/Dcel/Dcel";
import config from "./schematization.config";
import { getMapFrom } from "./lib/Ui/mapOutput";
import { drawC } from "./lib/Ui/cOutput";
import { drawMapGrid } from "./lib/Ui/mapGrid";
import { drawNavigator } from "./lib/Ui/schematizeNavigator";
import { Map } from "leaflet";

async function getJSON(path: string) {
  const response = await fetch(path);
  return response.json();
}

const input = [
  // "assets/data/geodata/ne_110m_admin_0_countries.json",
  // "assets/data/geodata/ne_110m_africa_admin0.json",
  // "assets/data/geodata/AUT_adm1-simple.json",
  // "assets/data/geodata/AUT_adm1.json",
  // "assets/data/geodata/central-austria.json",
  // "assets/data/shapes/triangle.json",
  // "assets/data/shapes/triangle-unaligned.json",
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
  // "assets/data/shapes/aligned-deviating.json",
  // "assets/data/shapes/unaligned-deviating.json",
  // "assets/data/shapes/unaligned-deviating-2.json",
  "assets/data/shapes/edge-cases.json",
];

const tests: { name: string; data: any; map: Map }[] = [];
input.forEach(async (test, idx) => {
  const name = test.slice(test.lastIndexOf("/") + 1, -5);
  const data = await getJSON(test);
  // TODO: validate() data (within getJSON??) check if of type polygon or multipolygon, check crs and save it for later?
  const dcel = Dcel.fromGeoJSON(data);
  dcel.schematize();

  dcel.log(name);
  const dcelMap = getMapFrom(dcel, name);
  tests[idx] = { name: name, data: data, map: dcelMap };
});

drawMapGrid(input);
drawC(document.getElementById("c"));
document.getElementById("c-text").innerText = `C(${config.c.orientations})`;
drawNavigator(tests);
