import Dcel from "../Dcel/Dcel";
import { getMapFrom } from "./mapOutput";
import * as L from "leaflet/";

export enum STOP {
  SUBDIVIDE = "subdivide",
  CLASSIFY = "classify",
  STAIRCASE = "staircase",
}

export function drawNavigator(maps: { name: string; data: any; map: L.Map }[]) {
  const navigator = document.getElementById("schematize-navigator");

  const ul = navigator.appendChild(document.createElement("ul"));
  ul.className = "plain";

  Object.values(STOP).forEach((stop) => {
    const li = document.createElement("li");
    const icon = document.createElement("span");
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const span = document.createElement("span");
    span.innerHTML = stop;
    svg.id = "path-" + stop;
    const sideLength = 30;
    const o = sideLength / 2;
    svg.setAttribute("viewBox", `0 0 ${sideLength} ${sideLength}`);
    svg.setAttribute("width", sideLength.toString());
    svg.setAttribute("height", sideLength.toString());
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", o.toString());
    circle.setAttribute("cy", o.toString());
    circle.setAttribute("r", ((sideLength * 0.2) / 2).toString());
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", o.toString());
    line.setAttribute("y1", "0");
    line.setAttribute("x2", o.toString());
    line.setAttribute("y2", sideLength.toString());
    line.setAttribute("stroke", "black");
    svg.append(circle, line);

    icon.className = "material-icons-outlined";
    icon.innerHTML = "circle";

    li.append(svg, " ", span);
    li.setAttribute("data-function", stop);
    li.style.height = sideLength + "px";
    li.style.lineHeight = sideLength + "px";
    ul.appendChild(li);
  });

  ul.childNodes.forEach((li) => {
    li.addEventListener("click", function () {
      const stop = this.getAttribute("data-function");
      maps.forEach((map) => {
        map.map.remove(); // clean current Leaflet Map

        const dcel = Dcel.fromGeoJSON(map.data); // create new dcel
        dcel.schematize(stop);
        dcel.log(map.name);
        getMapFrom(dcel, map.name);
      });
    });
  });
}
