import { EPSILON, TWO_PI } from "../geometry/constants";
import C from "./C";
import Sector from "./Sector";

class CRegular extends C {
  /**
   * The shift of the set C, in radians. By default a horizontal line, (0 radians).
   */
  beta: number;

  /**
   * @param orientations the number of orientations, at least 2 //TO-DO: enforce
   * @param beta the shift of C, in radians
   */
  constructor(orientations: number, beta: number = 0) {
    super();
    this.beta = beta;
    // The count is not kept: `orientations` is derived from the angles by C,
    // which is what keeps the two from drifting apart.
    this.angles = this.initializeAngles(orientations);
  }

  /**
   * Get the angles of C, two opposite directions per orientation.
   * @param orientations the number of orientations
   * @returns an array of angles
   */
  private initializeAngles(orientations: number) {
    const twoPi = TWO_PI;
    return Array(orientations * 2)
      .fill(0)
      .map((_, idx) => {
        let angle = this.beta + (idx * Math.PI) / orientations;
        // Normalize angle if it's very close to 2π
        if (Math.abs(angle - twoPi) <= EPSILON) angle = 0;
        return angle;
      })
      .toSorted();
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
      // The last sector reaches around to the first angle, which is 2π only for an
      // unshifted C: with a beta the arc between 2π and the first angle belongs to
      // it as well, and is left to no sector at all if the bound stops at 2π.
      const upperBound =
        idx + 1 == this.angles.length
          ? this.angles[0] + TWO_PI
          : this.angles[idx + 1];
      return new Sector(this, idx, angle, upperBound);
    });
  }
}

export default CRegular;
