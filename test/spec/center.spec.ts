import Dcel from "@/src/Dcel/Dcel";
import Subdivision from "@/src/geometry/Subdivision";

describe("center()", function () {
  it("returns the correct coordinates", function () {
    const s = Subdivision.fromCoordinates([
      [
        [
          [
            [-2, -2],
            [2, -2],
            [2, 2],
            [-2, 2],
          ],
        ],
      ],
    ]);
    expect(Dcel.fromSubdivision(s).center).toEqual([0, 0]);
  });
  it("returns the correct coordinates", function () {
    const s = Subdivision.fromCoordinates([
      [
        [
          [
            [0, 0],
            [4, 0],
            [4, 4],
            [0, 4],
          ],
        ],
      ],
    ]);
    expect(Dcel.fromSubdivision(s).center).toEqual([2, 2]);
  });
});
