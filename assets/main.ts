import Dcel from "./lib/Dcel/Dcel.js";
import config from "./schematization.config.js";
import { getMapFrom } from "./lib/Ui/mapOutput.js";
import { drawC } from "./lib/Ui/cOutput.js";

async function getJSON(path: string) {
  const response = await fetch(path);
  return response.json();
}

const tests = [
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
  "assets/data/shapes/aligned-deviating.json",
  "assets/data/shapes/edge-cases.json",
];

function calculateMapGrid(mapGridID: string) {
  const grid = document.getElementById(mapGridID);
  let templateColumns;
  if (tests.length === 1) {
    templateColumns = "1fr";
  } else if (tests.length > 1 && tests.length <= 5 && tests.length != 3) {
    templateColumns = "1fr 1fr";
  } else {
    templateColumns = "1fr 1fr 1fr";
  }
  grid.style.gridTemplateColumns = templateColumns;

  tests.forEach((test) => {
    const map = document.createElement("div");
    const name = test.slice(test.lastIndexOf("/") + 1, -5);
    map.id = name;
    map.className = "map";
    grid.appendChild(map);
  });
}

calculateMapGrid("map-grid");
drawC(document.getElementById("c"));
document.getElementById("c-text").innerText = `C(${config.c.orientations})`;

tests.forEach(async (test) => {
  const name = test.slice(test.lastIndexOf("/") + 1, -5);
  const data = await getJSON(test);
  // TODO: validate() data (within getJSON??) check if of type polygon or multipolygon, check crs and save it for later?
  const dcel = Dcel.fromGeoJSON(data);
  dcel.schematize();

  dcel.log(name);
  getMapFrom(dcel, name);
});
