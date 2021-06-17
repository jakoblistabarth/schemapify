import config from "../../schematization.config.js";
import Point from "../Geometry/Point.js";
import Line from "../Geometry/Line.js";

export function drawC(svgContainer: HTMLElement) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.id = "C";
  const sideLength = 20;
  const o = sideLength / 2;
  svg.setAttribute("viewBox", `0 0 ${sideLength} ${sideLength}`);
  svg.setAttribute("width", sideLength.toString());
  svg.setAttribute("height", sideLength.toString());
  svgContainer.appendChild(svg);
  config.c.getAngles().forEach((angle) => {
    const line = new Line(new Point(o, o), angle);
    const head = line.getPointOnLine(sideLength / 2);
    const lineNode = document.createElementNS("http://www.w3.org/2000/svg", "line");
    lineNode.setAttribute("x1", o.toString());
    lineNode.setAttribute("y1", o.toString());
    lineNode.setAttribute("x2", head.x.toString());
    lineNode.setAttribute("y2", head.y.toString());
    lineNode.setAttribute("stroke", "black");
    svg.appendChild(lineNode);
  });

  return svg;
}
