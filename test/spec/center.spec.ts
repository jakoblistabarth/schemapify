import Dcel from "@/src/DCEL/Dcel";
import MultiPolygon from "@/src/geometry/MultiPolygon";

describe("center()", function () {
  it("returns the correct coordinates", function () {
    const a = MultiPolygon.fromCoordinates([
      [
        [
          [-2, -2],
          [2, -2],
          [2, 2],
          [-2, 2],
        ],
      ],
    ]);
    expect(Dcel.fromMultiPolygons([a]).center).toEqual([0, 0]);
  });
  it("returns the correct coordinates", function () {
    const b = MultiPolygon.fromCoordinates([
      [
        [
          [0, 0],
          [4, 0],
          [4, 4],
          [0, 4],
        ],
      ],
    ]);
    expect(Dcel.fromMultiPolygons([b]).center).toEqual([2, 2]);
  });
});
