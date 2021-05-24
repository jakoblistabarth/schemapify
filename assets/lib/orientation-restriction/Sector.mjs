import config from "../../schematization.config.mjs";

class Sector {
  constructor(idx, lower, upper) {
    this.idx = idx; // horizontal line by default
    this.lower = lower;
    this.upper = upper;
  }

  getBounds() {
    return [this.lower, this.upper];
  }

  getIdx() {
    return this.idx;
  }

  getNeighbors(sectors = config.C.getSectors()) {
    const idx = this.getIdx();
    const next = (idx + 1) % sectors.length;
    const prev = idx == 0 ? sectors.length - 1 : idx - 1;
    return [sectors[next], sectors[prev]];
  }
}

export default Sector;
