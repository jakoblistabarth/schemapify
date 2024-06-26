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
