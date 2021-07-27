import Sector from "./Sector";

export default abstract class C {
  /**
   * an array of angles in radians, at least 4
   */
  angles: number[] = [];

  abstract getSectorAngle(): number;
  abstract getSectors(): Sector[];

  getDirections(): number[] {
    const n = this.angles.length;
    return Array.from(Array(n).keys());
  }

  getSector(idx: number): Sector | undefined {
    return this.getSectors().find((sector) => sector.idx == idx);
  }

  getValidDirections(numberOfEdges: number): number[][] {
    const calculateCombinations = function (
      combination: number[],
      directions: number[],
      edges: number
    ): number[][] {
      if (!edges) return [combination];

      const firstElements = directions.slice(0, directions.length - edges + 1);

      return firstElements
        .reduce((output: number[][][], el) => {
          const start = directions.indexOf(el);
          output.push(
            calculateCombinations([...combination, el], directions.slice(start + 1), edges - 1)
          );
          return output;
        }, [])
        .flat(1);
    };

    return calculateCombinations([], [...Array(this.angles.length).keys()], numberOfEdges);
  }
}
