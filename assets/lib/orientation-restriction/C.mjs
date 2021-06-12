import Sector from "./Sector.mjs";
import config from "../../schematization.config.mjs";
import Line from "../Line.mjs";
import Point from "../Point.mjs";

class C {
  constructor(orientations, beta = 0) {
    this.beta = beta; // horizontal line by default
    this.orientations = orientations; // n umber of orientations, //TODO: at least 2
    this.angles = this.getAngles();
  }

  getAngles() {
    const angles = [];
    for (let index = 0; index < this.orientations * 2; index++) {
      const angle = this.beta + (index * Math.PI) / this.orientations;
      angles.push(angle);
    }
    return angles;
  }

  getSectors() {
    return this.angles.map((angle, idx) => {
      const upperBound = idx + 1 == this.angles.length ? Math.PI * 2 : this.angles[idx + 1];
      return new Sector(this, idx, angle, upperBound);
    });
  }

  getSector(idx) {
    return this.getSectors().find((sector) => sector.idx == idx);
  }

  drawSVG(svgContainer) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.id = "C";
    const sideLength = 20;
    const o = sideLength / 2;
    svg.setAttribute("viewBox", `0 0 ${sideLength} ${sideLength}`);
    svg.setAttribute("width", sideLength);
    svg.setAttribute("height", sideLength);
    svgContainer.appendChild(svg);
    config.C.getAngles().forEach((angle) => {
      const line = new Line(new Point(o, o), angle);
      const head = line.getPointOnLine(sideLength / 2);
      const lineNode = document.createElementNS("http://www.w3.org/2000/svg", "line");
      lineNode.setAttribute("x1", o);
      lineNode.setAttribute("y1", o);
      lineNode.setAttribute("x2", head.x);
      lineNode.setAttribute("y2", head.y);
      lineNode.setAttribute("stroke", "black");
      svg.appendChild(lineNode);
    });

    return svg;
  }
}

export default C;
