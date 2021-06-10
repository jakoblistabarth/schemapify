import Point from "./Point.mjs";

class Line {
  constructor(point, angle) {
    this.point = point;
    this.angle = angle;
  }

  getPointOnLine(distance = 1) {
    return this.point.getNewPoint(distance, this.angle);
  }

  getABC() {
    const [x2, y2] = this.getPointOnLine().xy();
    const A = y2 - this.point.y;
    const B = this.point.x - x2;
    const C = A * this.point.x + B * this.point.y;
    return [A, B, C];
  }

  // as seen on https://www.topcoder.com/thrive/articles/Geometry%20Concepts%20part%202:%20%20Line%20Intersection%20and%20its%20Applications
  intersectsLine(line) {
    const [A1, B1, C1] = this.getABC();
    const [A2, B2, C2] = line.getABC();
    const det = A1 * B2 - A2 * B1;
    if (det === 0) {
      //Lines are parallel, no intersection Point
      return false;
    } else {
      let x = (B2 * C1 - B1 * C2) / det; // TODO: understand why negative zero? division of 0 by -1?
      let y = (A1 * C2 - A2 * C1) / det;
      x = Object.is(x, -0) ? 0 : x;
      y = Object.is(y, -0) ? 0 : y;
      return new Point(x, y);
    }
  }
}

export default Line;
