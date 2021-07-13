import Point from "./Point";

class LineSegment {
  endPoint1: Point;
  endPoint2: Point;

  constructor(endPoint1: Point, endPoint2: Point) {
    this.endPoint1 = endPoint1;
    this.endPoint2 = endPoint2;
  }

  getLength(): number {
    return this.endPoint1.distanceToPoint(this.endPoint2);
  }
}

export default LineSegment;
