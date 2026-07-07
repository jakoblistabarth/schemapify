import Dcel from "@/src/Dcel/Dcel";
import { describe, expect, test } from "vitest";

describe("center()", function () {
  test("returns the correct coordinates", function () {
    expect(
      Dcel.fromCoordinates([
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
      ]).center,
    ).toEqual([0, 0]);
  });
  test("returns the correct coordinates", function () {
    expect(
      Dcel.fromCoordinates([
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
      ]).center,
    ).toEqual([2, 2]);
  });
});
