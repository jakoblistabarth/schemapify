import Sector from "./Sector";

export default abstract class C {
  /**
   * an array of angles in radians, at least 4
   */
  angles: number[] = [];

  abstract get sectorAngle(): number;
  abstract get sectors(): Sector[];

  /**
   * Get the number of directions in C.
   */
  get directions() {
    const n = this.angles.length;
    return Array.from(Array(n).keys());
  }

  /**
   * Get the Sector with the given index.
   * @param idx The index of the Sector.
   */
  getSector(idx: number) {
    return this.sectors.find((sector) => sector.idx == idx);
  }

  /**
   * Get an array of valid candidate sets of directions for the given number of edges.
   * @param numberOfEdges Number of edges to be classified, i.e. incident to this edge. //TODO: check whether this is correct
   * @returns An array of valid sets of directions.
   */
  getValidDirections(numberOfEdges: number) {
    const calculateCombinations = function (
      combination: number[],
      directions: number[],
      edges: number,
    ): number[][] {
      if (!edges) return [combination];

      const firstElements = directions.slice(0, directions.length - edges + 1);

      return firstElements
        .reduce((output: number[][][], el) => {
          const start = directions.indexOf(el);
          output.push(
            calculateCombinations(
              [...combination, el],
              directions.slice(start + 1),
              edges - 1,
            ),
          );
          return output;
        }, [])
        .flat(1);
    };

    return calculateCombinations(
      [],
      Array.from(Array(this.angles.length).keys()),
      numberOfEdges,
    );
  }
}
