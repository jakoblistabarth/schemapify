import Point from "./Point";

/**
 * Class representing a ring.
 * It is defined by its Points.
 */
class Ring {
  /**
   * A ring is an array of {@link Point}s.
   */
  points: Point[];

  constructor(points: Point[]) {
    this.points = points;
  }

  static fromCoordinates(coordinates: [number, number][]) {
    const points = coordinates.map(([x, y]) => new Point(x, y));
    return new Ring(points);
  }

  get length() {
    return this.points.length;
  }

  get isClockwise() {
    const sum = this.points.slice(1).reduce((acc: number, point, i) => {
      const previous = this.points[i];
      const current = point;
      return (acc += (current.x - previous.x) * (current.y + previous.y));
    }, 0);

    return sum > 0;
  }

  reverse() {
    this.points.reverse();
    return this;
  }
}

export default Ring;
