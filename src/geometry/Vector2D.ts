import Point from "./Point";

class Vector2D {
  dx: number;
  dy: number;

  constructor(dx: number, dy: number) {
    this.dx = dx;
    this.dy = dy;
  }

  /**
   * Get the vector's magnitude.
   */
  get magnitude() {
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

  /**
   * Get the vector's inverse.
   */
  get invers() {
    return new Vector2D(-this.dx, -this.dy);
  }

  /**
   * Get the vector's unit vector.
   */
  get unitVector() {
    return this.times(1 / this.magnitude);
  }

  /**
   * Get the sum with the given vector.
   */
  plus(vector: Vector2D) {
    return new Vector2D(this.dx + vector.dx, this.dy + vector.dy);
  }

  /**
   * Get the difference with the given vector.
   */
  minus(vector: Vector2D) {
    return new Vector2D(this.dx - vector.dx, this.dy - vector.dy);
  }

  /**
   * Get the product with the given scalar.
   */
  times(scalar: number) {
    return new Vector2D(this.dx * scalar, this.dy * scalar);
  }

  /**
   * Get the dot product with the given vector.
   */
  dot(vector: Vector2D) {
    return this.dx * vector.dx + this.dy * vector.dy;
  }

  /**
   * Get the cross product with the given vector.
   */
  cross(vector: Vector2D) {
    return this.dx * vector.dy - this.dy * vector.dx;
  }

  /**
   * Get the Point representation of the Vector.
   * @returns The Vector as a {@link Point}.
   */
  toPoint() {
    return new Point(this.dx, this.dy);
  }

  /**
   * Get the array representation of the Vector.
   * @returns The Vector as an array of coordinates.
   */
  toArray(): [number, number] {
    return [this.dx, this.dy];
  }
}

export default Vector2D;
