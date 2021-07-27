export enum STEP {
  LOAD = "loadData",
  SUBDIVIDE = "subdivide",
  CLASSIFY = "classify",
  STAIRCASE = "staircase",
  SIMPLIFY = "simplify",
}

export function drawNavigator() {
  const navigator = document.getElementById("algorithm-navigator");
  if (!navigator) return;

  const ul = navigator.appendChild(document.createElement("ul"));
  ul.className = "plain";

  Object.values(STEP).forEach((stop) => {
    const li = document.createElement("li");
    if (stop === STEP.SIMPLIFY) li.className = "muted";
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
      console.log("click");
      // const stop = this.getAttribute("data-function");
    });
  });
}
