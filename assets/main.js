import Dcel from "./lib/dcel/Dcel.mjs";

async function getJSON(path) {
  const response = await fetch(path);
  return response.json();
}

const tests = [
  // "assets/data/geodata/ne_110m_africa_admin0.json",
  // "assets/data/geodata/AUT_adm1-simple.json",
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

function calculateMapGrid(mapGridID) {
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

tests.forEach(async (test) => {
  const name = test.slice(test.lastIndexOf("/") + 1, -5);
  const data = await getJSON(test);
  // TODO: validate() data (within getJSON??) check if of type polygon or multipolygon, check crs and save it for later?
  const dcel = Dcel.fromGeoJSON(data);
  dcel.schematize();

  dcel.log(name);
  dcel.toMap(name);
});
