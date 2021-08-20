import { renderDcel } from "./mapOutput";
import { getActiveDcel } from "./selectData";
import { STEP } from "../lib/DCEL/Dcel";

export const computationalTimeNode: HTMLSpanElement = document.createElement("span");
export let timeNodes: HTMLSpanElement[] = [];

export function drawNavigator() {
  const navigator = document.getElementById("algorithm-navigator");
  if (!navigator) return;

  const ul = navigator.appendChild(document.createElement("ul"));
  ul.className = "plain";

  const time = document.createElement("div");
  time.appendChild(document.createTextNode("Computational Time: "));
  time.className = "computational-time";
  time.appendChild(computationalTimeNode);
  navigator.appendChild(time);

  Object.values(STEP).forEach((stop) => {
    const li = document.createElement("li");
    const icon = document.createElement("span");
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const div = document.createElement("div");
    const span = document.createElement("span");
    span.className = "time";
    timeNodes.push(span);
    div.append(stop, span);
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

    li.append(svg, " ", div);
    li.style.height = sideLength + "px";
    li.style.lineHeight = sideLength + "px";

    li.addEventListener("click", function () {
      const dcel = getActiveDcel();
      dcel ? renderDcel(dcel, stop) : console.error("dcel could not be rendered");
    });

    ul.appendChild(li);
  });
}
