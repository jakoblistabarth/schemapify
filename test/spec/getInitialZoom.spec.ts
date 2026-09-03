import { getInitialZoom } from "@/app/helpers/getInitialZoom";
import BoundingBox from "@/src/helpers/BoundingBox";
import { describe, expect, test } from "vitest";

/** Austria in EPSG:3035, roughly 565km by 292km. */
const austria = new BoundingBox([
  [4279769, 2606318],
  [4845093, 2898053],
]);

/** The width at which the data fills the viewport, at a given zoom. */
const drawnWidth = (zoom: number) => (4845093 - 4279769) * 2 ** zoom;

describe("getInitialZoom", () => {
  test("fits the data into a desktop viewport.", () => {
    const zoom = getInitialZoom(austria, { width: 1440, height: 900 });

    expect(Number.isFinite(zoom)).toBe(true);
    expect(drawnWidth(zoom)).toBeLessThanOrEqual(1440);
  });

  test.each([
    ["iPhone SE", 375, 667],
    ["iPhone 15", 393, 852],
    ["narrow", 320, 568],
  ])(
    "stays finite on %s, where the padding would otherwise exceed the viewport.",
    (_name, width, height) => {
      const zoom = getInitialZoom(austria, { width, height });

      expect(Number.isNaN(zoom)).toBe(false);
      expect(Number.isFinite(zoom)).toBe(true);
    },
  );

  test("leaves the data visible on a phone, not scaled to nothing.", () => {
    const zoom = getInitialZoom(austria, { width: 390, height: 844 });

    // Comfortably more than a handful of pixels, and still inside the viewport.
    expect(drawnWidth(zoom)).toBeGreaterThan(100);
    expect(drawnWidth(zoom)).toBeLessThanOrEqual(390);
  });

  test("survives data without extent in one direction.", () => {
    const horizontal = new BoundingBox([
      [0, 0],
      [100, 0],
    ]);

    expect(
      Number.isFinite(getInitialZoom(horizontal, { width: 800, height: 600 })),
    ).toBe(true);
  });
});
