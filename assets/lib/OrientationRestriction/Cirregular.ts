import Sector from "./Sector.js";

/**
 * @property angles, an array of angles in radians, at least 4
 */
class Cirregular extends C {
  angles: number[];

  constructor(orientations: number[]) {
    super();
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

  getDirections(): number[] {
    const n = this.angles.length;
    return Array.from(Array(n).keys());
  }

  getAngles(): number[] {
    return this.angles;
  }

  getSectorAngle() {
    // TODO: for irregular Cs only meaningful with index as argument?
    return 0;
  }

  getValidDirections(): number[][] {
    return super.getValidDirections();
  }
}

export default Cirregular;
