class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  xy() {
    return [this.x, this.y];
  }

  distanceToPoint(p) {
    const [x1, y1] = this.xy();
    const [x2, y2] = p.xy();

    const a = x1 - x2;
    const b = y1 - y2;

    return Math.sqrt(a * a + b * b);
  }

  getNewPoint(distance, angle) {
    // QUESTION: do i really need this conditions for dx, and dy because js' sin/cos implementation is inaccurate??
    const dx = angle === Math.PI * 0.5 || angle === Math.PI * 1.5 ? 0 : Math.cos(angle);
    const dy = angle === Math.PI * 1 || angle === Math.PI * 2 ? 0 : Math.sin(angle);
    return new Point(this.x + distance * dx, this.y + distance * dy);
  }
}

export default Point;
