import C from "./C";
import Sector from "./Sector";

class CIrregular extends C {
  constructor(angles: number[]) {
    super();
    this.angles = angles; // TODO: at least 4
  }

  getSectors(): Sector[] {
    return this.angles.map((angle, idx) => {
      return new Sector(this, idx, angle, this.angles[idx + (1 % this.angles.length)]);
    });
  }

  getSectorAngle() {
    // TODO: for irregular Cs only meaningful with index as argument?
    return 0;
  }
}

export default CIrregular;
