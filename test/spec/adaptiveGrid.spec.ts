import { getGridOffset, getGridStep } from "@/app/helpers/AdaptiveGridLayer";
import { describe, expect, test } from "vitest";

/** The spacing between representable 32-bit floats around `value`. */
const float32Spacing = (value: number) => {
  const rounded = Math.fround(value);
  let step = 1e-6;
  while (Math.fround(rounded + step) === rounded) step *= 2;
  return step;
};

describe("getGridStep", () => {
  test.each([
    [150, 10],
    [1500, 100],
    [0.15, 0.01],
  ])("snaps a span of %d to a round step.", (span, expected) => {
    expect(getGridStep(span, 15)).toBeCloseTo(expected, 10);
  });

  test("only ever returns 1, 2 or 5 times a power of ten.", () => {
    for (let span = 1; span < 1e7; span *= 1.7) {
      const step = getGridStep(span, 15);
      const mantissa = step / 10 ** Math.floor(Math.log10(step));
      expect([1, 2, 5]).toContain(Math.round(mantissa));
    }
  });
});

describe("getGridOffset", () => {
  test("lands on the first grid line at or after the lower edge.", () => {
    // 4_560_003 is 3 past the grid line at 4_560_000, so the next is 7 away.
    expect(getGridOffset(4_560_003, 10)).toBeCloseTo(7, 6);
  });

  test("is zero when the edge already sits on a grid line.", () => {
    expect(getGridOffset(4_560_000, 10)).toBeCloseTo(0, 6);
  });

  test.each([
    [4_560_003.7, 10],
    [2_890_411.25, 0.5],
    [-1_234_567.8, 20],
  ])(
    "stays within one step for min %d, so the shader never sees a large number.",
    (min, step) => {
      const offset = getGridOffset(min, step);

      expect(offset).toBeGreaterThanOrEqual(0);
      expect(offset).toBeLessThan(step);
    },
  );

  test("survives float32 where the absolute coordinate would not.", () => {
    // A projected easting, zoomed in far enough for a sub-metre grid step.
    const min = 4_560_003.7;
    const step = 0.5;
    const offset = getGridOffset(min, step);

    // Neighbouring float32 values around the absolute coordinate are half a
    // grid step apart, so the shader could not place a dot on it accurately.
    expect(float32Spacing(min)).toBeGreaterThan(step / 2);
    // The offset carries the same information within a thousandth of a step.
    expect(Math.abs(Math.fround(offset) - offset)).toBeLessThan(step / 1000);
  });
});
