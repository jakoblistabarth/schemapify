import BoundingBox from "@/src/helpers/BoundingBox";

describe("boundingBox()", function () {
  it("returns the correct bbox for a square", function () {
    expect(
      new BoundingBox([
        [-2, -2],
        [2, -2],
        [2, 2],
        [-2, 2],
      ]).bounds,
    ).toEqual([-2, 2, -2, 2]);
  });
  it("returns the correct bbox for a rotated rectangle", function () {
    expect(
      new BoundingBox([
        [-2, -1],
        [-1, -2],
        [2, 1],
        [1, 2],
      ]).bounds,
    ).toEqual([-2, 2, -2, 2]);
  });
});
