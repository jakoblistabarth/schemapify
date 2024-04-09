import Point from "./Point";

/**
 * Class representing a ring.
 * It is defined by its Points
 * Its points are always returned in counterclockwise order.
 */
class Ring {
  /**
   * A ring is an array of {@link Point}s.
   */
  _points: Point[];

  constructor(points: Point[]) {
    this._points = points;
  }

  static fromCoordinates(coordinates: [number, number][]) {
    const points = coordinates.map(([x, y]) => new Point(x, y));
    return new Ring(points);
  }

  get points(): Point[] {
    return this.isClockwise ? [...this._points].reverse() : this._points;
  }

  get length() {
    return this.points.length;
  }

  get isClockwise() {
    const sum = this._points.reduce((acc: number, point, i, points) => {
      const next = points[i + 1] ?? points[0];
      return (acc += (point.x + next.x) * (point.y - next.y));
    }, 0);

    return sum > 0;
  }

  /**
   * Returns the centroid of the ring.
   */
  get centroid() {
    let area = 0;
    const centroid = this.points.reduce(
      (acc, point, i, arr) => {
        const xi = point.x,
          yi = point.y;
        const xj = arr[(i - 1 + arr.length) % arr.length].x,
          yj = arr[(i - 1 + arr.length) % arr.length].y;
        const a = xi * yj - xj * yi;
        area += a;
        acc[0] += (xi + xj) * a;
        acc[1] += (yi + yj) * a;
        return acc;
      },
      [0, 0],
    );

    area *= 0.5;
    centroid[0] /= 6 * area;
    centroid[1] /= 6 * area;

    return centroid;
  }
}

export default Ring;
