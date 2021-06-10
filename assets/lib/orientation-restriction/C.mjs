import Sector from "./Sector.mjs";

class C {
  constructor(orientations, beta = 0) {
    this.beta = beta; // horizontal line by default
    this.orientations = orientations; // n umber of orientations, //TODO: at least 2
    this.angles = this.getAngles();
  }

  getAngles() {
    const angles = [];
    for (let index = 0; index < this.orientations * 2; index++) {
      const angle = this.beta + (index * Math.PI) / this.orientations;
      angles.push(angle);
    }
    return angles;
  }

  getSectors() {
    return this.angles.map((angle, idx) => {
      const upperBound = idx + 1 == this.angles.length ? Math.PI * 2 : this.angles[idx + 1];
      return new Sector(this, idx, angle, upperBound);
    });
  }

  getSector(idx) {
    return this.getSectors().find((sector) => sector.idx == idx);
  }
}

export default C;
