class Vector2D {
  dx: number;
  dy: number;

  constructor(dx: number, dy: number) {
    this.dx = dx;
    this.dy = dy;
  }

  getMagnitude(): number {
    return Math.sqrt(Math.pow(this.dx, 2) + Math.pow(this.dy, 2));
  }

  getNormal(): Vector2D {
    return new Vector2D(-this.dy, this.dx);
  }

  getInvers(): Vector2D {
    return new Vector2D(-this.dx, -this.dy);
  }

  getUnitVector(): Vector2D {
    return this.multiply(1 / this.getMagnitude());
  }

  multiply(scalar: number): Vector2D {
    const dx = this.dx * scalar;
    const dy = this.dy * scalar;
    return new Vector2D(dx, dy);
  }

  dot(vector: Vector2D): number {
    return this.dx * vector.dx + this.dy * vector.dy;
  }
}

export default Vector2D;
