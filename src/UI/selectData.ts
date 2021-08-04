import { draw } from "./mapGrid";

export function drawDataSelect(inputFiles: string[]) {
  const bottomNav = document.getElementById("select-data");
  if (!bottomNav) return;
  const show = inputFiles.slice(13, 14);

  inputFiles.forEach((file, idx) => {
    const filename = file.substring(file.lastIndexOf("/") + 1, file.length - 5);
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    const span = document.createElement("span");
    span.innerHTML = "#" + idx + " " + filename;
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
  "geodata/AUT_adm1-simple.json",
  "geodata/AUT_adm1.json",
  "geodata/ne_50m_europe_mapunits-s20.json",
  "geodata/ne_50m_africa_admin0-s20.json",
  // "shapes/2plgn-adjacent.json",
  // "shapes/2plgn-islands-hole.json",
  "shapes/2plgn-islands-holes.json",
  // "shapes/2plgn-islands.json",
  // "shapes/2plgn.json",
  // "shapes/2triangle-adjacent.json",
  "shapes/3plgn-complex.json",
  // "shapes/3plgn-adjacent.json",
  "shapes/aligned-deviating.json",
  "shapes/dart.json",
  "shapes/edge-cases.json",
  "shapes/edge-move-test.json",
  "shapes/enclave.json",
  "shapes/enclave2.json",
  "shapes/inflection-test.json",
  "shapes/smallestContraction-2.json",
  // "shapes/square-hole-island-hole.json",
  // "shapes/square-hole-island.json",
  "shapes/square-hole.json",
  // "shapes/square-islands.json",
  "shapes/square.json",
  // "shapes/triangle-hole.json",
  "shapes/triangle-unaligned.json",
  // "shapes/triangle.json",
  "shapes/unaligned-deviating-2.json",
  "shapes/unaligned-deviating.json",
  "shapes/v-shape.json",
];
