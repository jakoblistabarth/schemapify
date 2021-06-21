import Sector from "./Sector.js";

/**
 * @property angles, an array of angles in radians, at least 4
 */
class Cirregular {
  angles: number[];

  constructor(orientations: number[]) {
    this.angles = orientations; // TODO: at least 4
  }

  getSectors(): Array<Sector> {
    return this.angles.map((angle, idx) => {
      return new Sector(this, idx, angle, this.angles[idx + (1 % this.angles.length)]);
    });
  }

  getSector(idx: number): Sector {
    return this.getSectors().find((sector) => sector.idx == idx);
  }

  getAngles(): number[] {
    return this.angles;
  }
}

export default Cirregular;
