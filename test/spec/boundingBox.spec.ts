import { boundingBox } from "@/src/helpers/BoundingBox";

describe("boundingBox()", function () {
  it("returns the correct bbox for a square", function () {
    expect(
      boundingBox([
        [-2, -2],
        [2, -2],
        [2, 2],
        [-2, 2],
      ]),
    ).toEqual([-2, 2, -2, 2]);
  });
  it("returns the correct bbox for a rotated rectangle", function () {
    expect(
      boundingBox([
        [-2, -1],
        [-1, -2],
        [2, 1],
        [1, 2],
      ]),
    ).toEqual([-2, 2, -2, 2]);
  });
});
