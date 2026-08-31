import Point from "./Point";

/** A ring's points as plain coordinates. */
export type RingCoordinates = [number, number][];

/**
 * Class representing a ring.
 * It is defined by its {@link Point}s.
 * Its points are always returned in counterclockwise order.
 */
class Ring {
  /**
   * A ring is an array of {@link Point}s.
   */
  _points: Point[];

  constructor(points: Point[]) {
    this._points = Ring.validatePoints(points);
  }

  /**
   * Create a ring from an array of coordinates.
   * @param coordinates An array of coordinates.
   * @returns A new Ring.
   */
  static fromCoordinates(coordinates: RingCoordinates) {
    const points = coordinates.map(([x, y]) => new Point(x, y));
    return new Ring(points);
  }

  /**
   * Reduce the ring to plain coordinates, the inverse of {@link Ring.fromCoordinates}.
   * @returns The ring's points as coordinates, in counterclockwise order.
   */
  toCoordinates(): RingCoordinates {
    return this.points.map((point) => point.xy);
  }

  static validatePoints(points: Point[]) {
    const [first, last] = [points[0], points[points.length - 1]];
    if (!first.equals(last)) points.push(first);
    return points;
  }

  /**
   * Get the ring's points.
   */
  get points() {
    return this.isClockwise ? [...this._points].toReversed() : this._points;
  }

  /**
   * Get the ring's length.
   */
  get length() {
    return this.points.length;
  }

  /**
   * Calculates the area of the {@link Ring}.
   * #TO-DO: add credits!
   * The array of Points need to be sorted (either clockwise or counter-clockwise).
   * @returns A number indicating the area of the {@link Ring}.
   */
  get area() {
    return this.points.reduce((acc, point, i, points) => {
      const next = points[i == points.length - 1 ? 0 : i + 1];
      const addX = point.x;
      const addY = next.y;
      const subX = next.x;
      const subY = point.y;

      acc += addX * addY * 0.5;
      acc -= subX * subY * 0.5;

      return acc;
    }, 0);
  }

  /**
   * Returns a boolean indicating whether the ring is clockwise.
   */
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
    const areaWeightedSums = this.points.reduce(
      (acc, point, i) => {
        const prevPoint =
          this.points[(i - 1 + this.points.length) % this.points.length];
        const areaSegment = point.x * prevPoint.y - prevPoint.x * point.y;
        acc.sumX += (point.x + prevPoint.x) * areaSegment;
        acc.sumY += (point.y + prevPoint.y) * areaSegment;
        acc.totalArea += areaSegment;
        return acc;
      },
      { sumX: 0, sumY: 0, totalArea: 0 },
    );

    areaWeightedSums.totalArea *= 0.5;
    areaWeightedSums.sumX /= 6 * areaWeightedSums.totalArea;
    areaWeightedSums.sumY /= 6 * areaWeightedSums.totalArea;

    return [areaWeightedSums.sumX, areaWeightedSums.sumY];
  }
}

export default Ring;
