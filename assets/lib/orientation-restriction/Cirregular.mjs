import Sector from "./Sector.mjs";

class Cirregular {
  constructor(orientations) {
    this.angles = orientations; // TODO: at least 4
  }

  getSectors() {
    return this.angles.map((angle, idx) => {
      return new Sector(this, idx, angle, this.angles[idx + (1 % this.angles.length)]);
    });
  }

  getSector(idx) {
    return this.getSectors().find((sector) => sector.idx == idx);
  }
}

export default Cirregular;
