class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  xy() {
    return [this.x, this.y];
  }

  getNewPoint(distance, angle) {
    // QUESTION: do i really need this conditions for dx, and dy because js' sin/cos implementation is inaccurate??
    const dx = angle === Math.PI * 0.5 || angle === Math.PI * 1.5 ? 0 : Math.cos(angle);
    const dy = angle === Math.PI * 1 || angle === Math.PI * 2 ? 0 : Math.sin(angle);
    return new Point(this.x + distance * dx, this.y + distance * dy);
  }
}

export default Point;
