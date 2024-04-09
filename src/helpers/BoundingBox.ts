import Point from "../geometry/Point";

class BoundingBox {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;

  constructor(points: [number, number][]) {
    [this.xMin, this.xMax, this.yMin, this.yMax] =
      BoundingBox.fromCoordinates(points);
  }
  static fromCoordinates = (points: [number, number][]) => {
    return points.reduce(
      (boundingBox, point) => {
        boundingBox[0] = Math.min(boundingBox[0], point[0]);
        boundingBox[1] = Math.max(boundingBox[1], point[0]);
        boundingBox[2] = Math.min(boundingBox[2], point[1]);
        boundingBox[3] = Math.max(boundingBox[3], point[1]);
        return boundingBox;
      },
      [Infinity, -Infinity, Infinity, -Infinity],
    );
  };

  get center(): [number, number] {
    return [(this.xMin + this.xMax) / 2, (this.yMin + this.yMax) / 2];
  }

  get diameter() {
    const [a, c] = [
      new Point(this.xMin, this.yMin),
      new Point(this.xMax, this.yMax),
    ];
    return a.distanceToPoint(c);
  }

  get bounds() {
    return [this.xMin, this.xMax, this.yMin, this.yMax];
  }
}

export default BoundingBox;
