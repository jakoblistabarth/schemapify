import Point from "./Point";

class Vector2D {
  dx: number;
  dy: number;

  constructor(dx: number, dy: number) {
    this.dx = dx;
    this.dy = dy;
  }

  getMagnitude() {
    return Math.sqrt(Math.pow(this.dx, 2) + Math.pow(this.dy, 2));
  }

  /**
   * Get the vectors normal vector.
   * @param counterclockwise boolean, indicating in which of the two halfspaces the normal vector should be situated.
   * @returns
   */
  getNormal(counterclockwise = true) {
    return counterclockwise
      ? new Vector2D(-this.dy, this.dx)
      : new Vector2D(this.dy, -this.dx);
  }

  getInvers() {
    return new Vector2D(-this.dx, -this.dy);
  }

  getUnitVector() {
    return this.times(1 / this.getMagnitude());
  }

  plus(vector: Vector2D) {
    return new Vector2D(this.dx + vector.dx, this.dy + vector.dy);
  }

  minus(vector: Vector2D) {
    return new Vector2D(this.dx - vector.dx, this.dy - vector.dy);
  }

  times(scalar: number) {
    return new Vector2D(this.dx * scalar, this.dy * scalar);
  }

  dot(vector: Vector2D) {
    return this.dx * vector.dx + this.dy * vector.dy;
  }

  cross(vector: Vector2D) {
    return this.dx * vector.dy - this.dy * vector.dx;
  }

  toPoint() {
    return new Point(this.dx, this.dy);
  }

  toArray(): [number, number] {
    return [this.dx, this.dy];
  }
}

export default Vector2D;
