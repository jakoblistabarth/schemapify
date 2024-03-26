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
    const sum = this.points.reduce((acc: number, point, i, points) => {
      const next = points[i + 1] ?? points[0];
      return (acc += (point.x + next.x) * (point.y - next.y));
    }, 0);

    return sum > 0;
  }

  /**
   * Reverses the order of the {@link Ring}'s points.
   * @returns The reversed {@link Ring}.
   */
  reverse() {
    this.points.reverse();
    return this;
  }
}

export default Ring;
