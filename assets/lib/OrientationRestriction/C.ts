import Sector from "./Sector";

/**
 * @property beta, the shift of the C of set, by default a horizontal line (0)
 * @property orientations, the umber of orientation, at least 2
 * @property angles, an array of angles in radians
 */
class C {
  beta: number;
  orientations: number;
  angles: number[];

  constructor(orientations: number, beta: number = 0) {
    this.beta = beta;
    this.orientations = orientations; //TODO: at least 2
    this.angles = this.getAngles();
  }

  getAngles(): number[] {
    const angles = [];
    for (let index = 0; index < this.orientations * 2; index++) {
      const angle = this.beta + (index * Math.PI) / this.orientations;
      angles.push(angle);
    }
    return angles;
  }

  getSectorAngle(): number {
    return Math.PI / this.orientations;
  }

  getDirections(): number[] {
    const n = this.orientations * 2;
    return Array.from(Array(n).keys());
  }

  getSectors(): Array<Sector> {
    return this.angles.map((angle, idx) => {
      const upperBound = idx + 1 == this.angles.length ? Math.PI * 2 : this.angles[idx + 1];
      return new Sector(this, idx, angle, upperBound);
    });
  }

  getSector(idx: number): Sector {
    return this.getSectors().find((sector) => sector.idx == idx);
  }
}

export default C;
