import C from "./C";
import Sector from "./Sector";

class CRegular extends C {
  /**
   * The shift of the set C, in radians. By default a horizontal line, (0 radians).
   */
  beta: number;
  /**
   * The number of orientation, at least 2
   */
  orientations: number;

  constructor(orientations: number, beta: number = 0) {
    super();
    this.beta = beta;
    this.orientations = orientations; //TO-DO: at least 2
    this.angles = this.initializeAngles();
  }

  /**
   * Get the angles of C.
   * @returns an array of angles
   */
  private initializeAngles() {
    return Array(this.orientations * 2)
      .fill(0)
      .map((_, idx) => {
        return this.beta + (idx * Math.PI) / this.orientations;
      });
  }

  /**
   * Get the central angle of a Sector.
   * @returns The central angle of a {@link Sector}.
   */
  get sectorAngle() {
    return Math.PI / this.orientations;
  }

  /**
   * Get the sectors of C.
   * @returns An array of {@link Sector}s.
   */
  get sectors(): Sector[] {
    return this.angles.map((angle, idx) => {
      const upperBound =
        idx + 1 == this.angles.length ? Math.PI * 2 : this.angles[idx + 1];
      return new Sector(this, idx, angle, upperBound);
    });
  }
}

export default CRegular;
