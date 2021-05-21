import { v4 as uuid } from "uuid";

class Vertex {
  constructor(x, y) {
    this.uuid = uuid();
    this.x = x;
    this.y = y;
    this.edges = [];
  }

  static getKey(x, y) {
    return `${x}/${y}`; // TODO: is there a better way to ensure that a coordinate pair vertex is added only once to the vertex list?
  }

  sortEdges() {
    this.edges = this.edges.sort((a, b) => {
      return b.getAngle() - a.getAngle();
    });
  }

  getDistance(p) {
    const [x1, y1] = [this.x, this.y];
    const [x2, y2] = [p.x, p.y];

    const a = x1 - x2;
    const b = y1 - y2;

    const c = Math.sqrt(a * a + b * b);
    return c;
  }

  removeIncidentEdge(edge) {
    const idx = this.edges.indexOf(edge);
    if (idx > -1) {
      this.edges.splice(idx, 1);
    }
    return this.edges;
  }
}

export default Vertex;
