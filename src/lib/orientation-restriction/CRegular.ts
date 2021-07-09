import C from "./C";
import Sector from "./Sector";

class CRegular extends C {
  /**
   * the shift of the C of set, by default a horizontal line (0)
   */
  beta: number;
  /**
   * the number of orientation, at least 2
   */
  orientations: number;

  constructor(orientations: number, beta: number = 0) {
    super();
    this.beta = beta;
    this.orientations = orientations; //TODO: at least 2
    this.angles = this.getAngles();
  }

  private getAngles(): number[] {
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

  getSectors(): Sector[] {
    return this.angles.map((angle, idx) => {
      const upperBound = idx + 1 == this.angles.length ? Math.PI * 2 : this.angles[idx + 1];
      return new Sector(this, idx, angle, upperBound);
    });
  }
}

export default CRegular;
