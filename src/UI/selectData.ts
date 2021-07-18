import { draw } from "./mapGrid";

export function drawDataSelect(inputFiles: string[]) {
  const bottomNav = document.getElementById("select-data");

  const show = inputFiles.slice(0, 1);

  inputFiles.forEach((file) => {
    const filename = file.substring(file.lastIndexOf("/") + 1, file.length - 5);
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    const span = document.createElement("span");
    span.innerHTML = filename;
    checkbox.setAttribute("type", "checkbox");
    checkbox.value = file;
    checkbox.checked = show.includes(file);
    checkbox.name = "files";
    checkbox.addEventListener("change", function (event) {
      if ((event.target as HTMLInputElement).checked) {
        show.push(file);
      } else {
        show.splice(show.indexOf(file), 1);
      }
      draw(show);
    });
    label.append(checkbox, span);
    bottomNav.append(label);
  });

  draw(show);
  return bottomNav;
}

export const tests: string[] = [
  "data/geodata/AUT_adm1-simple.json",
  "data/geodata/AUT_adm1.json",
  "data/geodata/ne_50m_europe_mapunits-s20.json",
  "data/geodata/ne_50m_africa_admin0-s20.json",
  "data/geodata/ne_50m_admin_0_south-africa_map_units_epsg-54030_s20.zip",
  // "data/shapes/2plgn-adjacent.json",
  // "data/shapes/2plgn-islands-hole.json",
  // "data/shapes/2plgn-islands-holes.json",
  // "data/shapes/2plgn-islands.json",
  // "data/shapes/2plgn.json",
  // "data/shapes/2triangle-adjacent.json",
  "data/shapes/3plgn-complex.json",
  // "data/shapes/3plgn.json",
  "data/shapes/aligned-deviating.json",
  "data/shapes/edge-cases.json",
  // "data/shapes/enclave.json",
  // "data/shapes/enclave2.json",
  // "data/shapes/square-hole-island-hole.json",
  // "data/shapes/square-hole-island.json",
  // "data/shapes/square-hole.json",
  // "data/shapes/square-islands.json",
  // "data/shapes/square.json",
  // "data/shapes/triangle-hole.json",
  "data/shapes/triangle-unaligned.json",
  // "data/shapes/triangle.json",
  "data/shapes/unaligned-deviating-2.json",
  // "data/shapes/unaligned-deviating.json",
];
