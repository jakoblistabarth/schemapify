import C from "./C";
import Sector from "./Sector";

class CIrregular extends C {
  constructor(angles: number[]) {
    super();
    this.angles = angles; // TODO: at least 4
  }

  /**
   * Get the sectors of C.
   * @returns An array of {@link Sector}s.
   */
  get sectors(): Sector[] {
    return this.angles.map((angle, idx) => {
      return new Sector(
        this,
        idx,
        angle,
        this.angles[idx + (1 % this.angles.length)],
      );
    });
  }

  /**
   * Get the central angle of a Sector.
   * @returns The central angle of a {@link Sector}.
   * TODO: @param idx for irregular Cs only meaningful with index as argument?
   */
  get sectorAngle() {
    // TODO: for irregular Cs only meaningful with index as argument?
    return 0;
  }
}

export default CIrregular;
