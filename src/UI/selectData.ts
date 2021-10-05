import Dcel from "src/lib/DCEL/Dcel";
import { draw } from "./mapContainer";

export function drawDataSelect() {
  const bottomNav = document.getElementById("select-data");
  if (!bottomNav) return;

  tests.forEach((file, idx) => {
    const filename = file.substring(file.lastIndexOf("/") + 1, file.length - 5);
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    const span = document.createElement("span");
    span.innerHTML = "#" + idx + " " + filename;
    checkbox.setAttribute("type", "checkbox");
    checkbox.value = file;
    checkbox.checked = file === activeDcel;
    checkbox.name = "files";
    checkbox.addEventListener("change", function (event) {
      Array.from(document.querySelectorAll<HTMLInputElement>('input[name="files"]')).forEach(
        (i) => (i.checked = i.value === file)
      );
      activeDcel = file;
      draw(file, dcelMap);
    });
    label.append(checkbox, span);
    bottomNav.append(label);
  });

  draw(activeDcel, dcelMap);
  return bottomNav;
}

export const tests: string[] = [
  "geodata/AUT_adm0-s0_5.json",
  "geodata/AUT_adm0-s1.json",
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
  "shapes/contractions-equal.json",
  "shapes/contractions-2.json",
  "shapes/dart.json",
  "shapes/edge-cases.json",
  "shapes/edge-move-test.json",
  "shapes/enclave.json",
  "shapes/enclave2.json",
  "shapes/inflection-test.json",
  "shapes/smallest-contraction.json",
  "shapes/smallest-contraction-1a.json",
  "shapes/smallest-contraction-2.json",
  "shapes/square-hole-island-hole.json",
  "shapes/square-hole-island.json",
  "shapes/square-hole.json",
  "shapes/square-islands.json",
  "shapes/square.json",
  // "shapes/triangle-hole.json",
  "shapes/triangle-unaligned.json",
  // "shapes/triangle.json",
  "shapes/unaligned-deviating-2.json",
  "shapes/unaligned-deviating.json",
  "shapes/v-shape.json",
];

let activeDcel = tests[17];

export function getActiveDcel(): Dcel | undefined {
  return dcelMap.get(activeDcel);
}

export type DCELMap = Map<string, Dcel>;

export const dcelMap: DCELMap = new Map();
