import CIrregular from "@/src/c-oriented-schematization/CIrregular";
import CRegular from "@/src/c-oriented-schematization/CRegular";
import { TWO_PI } from "@/src/geometry/constants";
import { degreesToRadians, radiansToDegrees } from "@/src/utilities";
import { describe, expect, test } from "vitest";

const degrees = (angles: number[]) => angles.map(degreesToRadians);
const inDegrees = (angles: number[]) =>
  angles.map((angle) => Math.round(radiansToDegrees(angle)));

/** The widest span between two consecutive directions, around the circle. */
const widestSector = (c: CIrregular) =>
  Math.max(...c.sectors.map(({ lower, upper }) => upper - lower));

describe("An irregular C", () => {
  test("completes every orientation with its opposite.", () => {
    const c = new CIrregular(degrees([0, 45, 90, 135]));

    expect(inDegrees(c.angles)).toEqual([0, 45, 90, 135, 180, 225, 270, 315]);
  });

  test("takes a full set of directions unchanged, so completing is idempotent.", () => {
    const directions = [0, 45, 90, 135, 180, 225, 270, 315];

    expect(inDegrees(new CIrregular(degrees(directions)).angles)).toEqual(
      directions,
    );
  });

  test("sorts its angles, so the sectors span the circle in order.", () => {
    const c = new CIrregular(degrees([90, 0, 270, 180]));

    expect(inDegrees(c.angles)).toEqual([0, 90, 180, 270]);
  });

  test("drops duplicates, including the pair either side of a full turn.", () => {
    const c = new CIrregular(degrees([0, 360, 90, 180, 270]));

    expect(inDegrees(c.angles)).toEqual([0, 90, 180, 270]);
  });

  test("closes the last sector by reaching around to the first angle.", () => {
    const c = new CIrregular(degrees([0, 30]));
    const last = c.sectors[c.sectors.length - 1];

    // Previously `angles[idx + (1 % length)]`, which is just `angles[idx + 1]`
    // and so left the last sector's upper bound undefined.
    expect(last.upper).toBeDefined();
    expect(last.upper).toBeCloseTo(c.angles[0] + TWO_PI);
  });

  test("gives every sector a bounded span narrower than half a turn.", () => {
    const c = new CIrregular(degrees([0, 30, 90]));

    expect(c.sectors.length).toBe(6);
    for (const { lower, upper } of c.sectors) {
      expect(Number.isFinite(lower)).toBe(true);
      expect(upper).toBeGreaterThan(lower);
    }
    // A sector of half a turn or more is what made a one-sided set of angles
    // blow the schematization up rather than fail.
    expect(widestSector(c)).toBeLessThan(Math.PI);
  });

  test("reports half as many orientations as it has directions.", () => {
    const c = new CIrregular(degrees([0, 45, 90, 135]));

    expect(c.angles.length).toBe(8);
    expect(c.orientations).toBe(4);
  });

  test("matches a regular C given the same angles.", () => {
    const regular = new CRegular(4);
    const irregular = new CIrregular(regular.angles);

    expect(irregular.sectors.length).toBe(regular.sectors.length);
    // Completing an already-complete set renormalizes it, which can shift an
    // angle by an ulp, so the bounds are compared with a tolerance.
    irregular.sectors.forEach(({ lower, upper }, idx) => {
      expect(lower).toBeCloseTo(regular.sectors[idx].lower);
      expect(upper).toBeCloseTo(regular.sectors[idx].upper);
    });
  });

  describe("rejects a set it cannot schematize against:", () => {
    test("fewer than two distinct orientations.", () => {
      expect(() => new CIrregular(degrees([45]))).toThrow(
        /at least 2 distinct orientations/,
      );
    });

    test("orientations that are the same line.", () => {
      expect(() => new CIrregular(degrees([45, 225]))).toThrow(
        /at least 2 distinct orientations/,
      );
    });

    test("no orientations at all.", () => {
      expect(() => new CIrregular([])).toThrow(
        /at least 2 distinct orientations/,
      );
    });

    test("angles that are not numbers.", () => {
      expect(() => new CIrregular([0, NaN])).toThrow(/have to be numbers/);
    });
  });
});
