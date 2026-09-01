import { TWO_PI } from "../geometry/constants";
import C from "./C";

class Sector {
  c: C;
  idx: number;
  lower: number;
  upper: number;

  constructor(c: C, idx: number, lower: number, upper: number) {
    this.c = c;
    this.idx = idx;
    this.lower = lower;
    this.upper = upper;
  }

  /**
   * Get the Sector's lower and upper bounds.
   * @returns An array containing the Sector's lower and upper bounds.
   */
  getBounds() {
    return [this.lower, this.upper];
  }

  /**
   * Get the Sector's index.
   * @returns The Sector's index.
   */
  getIdx() {
    return this.idx;
  }

  /**
   * Get the two adjacent Sector's neighbors.
   * @returns An array containing the adjacent Sectors.
   */
  getNeighbors() {
    const sectors = this.c.sectors;
    const idx = this.getIdx();
    const prev = idx == 0 ? sectors.length - 1 : idx - 1;
    const next = (idx + 1) % sectors.length;
    return [sectors[prev], sectors[next]];
  }

  /**
   * Determines whether the Sector encloses a given angle.
   * @param angle The angle to be checked in radians.
   * @returns A Boolean indicating whether the Sector encloses the angle.
   */
  encloses(angle: number) {
    const [lowerBound, upperBound] = this.getBounds();
    // The last sector reaches past 2π, so an angle below its lower bound is measured
    // once around before it can be compared.
    const reached = angle < lowerBound ? angle + TWO_PI : angle;
    return reached >= lowerBound && reached <= upperBound;
  }
}

export default Sector;
