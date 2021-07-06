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

  getBounds(): number[] {
    return [this.lower, this.upper];
  }

  getIdx(): number {
    return this.idx;
  }

  getNeighbors(): Array<Sector> {
    const sectors = this.c.getSectors();
    const idx = this.getIdx();
    const prev = idx == 0 ? sectors.length - 1 : idx - 1;
    const next = (idx + 1) % sectors.length;
    return [sectors[prev], sectors[next]];
  }

  encloses(angle: number): boolean {
    const [lowerBound, upperBound] = this.getBounds();
    return angle >= lowerBound && angle <= upperBound;
  }
}

export default Sector;
