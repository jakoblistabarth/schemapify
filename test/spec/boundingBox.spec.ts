import BoundingBox from "@/src/helpers/BoundingBox";
import { describe, expect, test } from "vitest";

describe("boundingBox()", function () {
  test("returns the correct bbox for a square", function () {
    expect(
      new BoundingBox([
        [-2, -2],
        [2, -2],
        [2, 2],
        [-2, 2],
      ]).bounds,
    ).toEqual([-2, 2, -2, 2]);
  });
  test("returns the correct bbox for a rotated rectangle", function () {
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
