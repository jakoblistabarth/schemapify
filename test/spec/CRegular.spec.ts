import CRegular from "@/src/c-oriented-schematization/CRegular";
import { degreesToRadians, radiansToDegrees } from "@/src/utilities";
import { describe, expect, test } from "vitest";

const inDegrees = (angles: number[]) =>
  angles.map((angle) => Math.round(radiansToDegrees(angle)));

describe("A regular C", () => {
  test.each([2, 3, 4, 6])(
    "reports back the %i orientations it was built from.",
    (orientations) => {
      const c = new CRegular(orientations);

      // The count is derived from the angles rather than stored, so this is
      // what keeps `orientations` and `angles` from drifting apart.
      expect(c.orientations).toBe(orientations);
      expect(c.angles.length).toBe(orientations * 2);
    },
  );

  test("holds each orientation as two opposite directions.", () => {
    expect(inDegrees(new CRegular(2).angles)).toEqual([0, 90, 180, 270]);
  });

  test("keeps reporting its orientations when shifted by beta.", () => {
    const c = new CRegular(3, degreesToRadians(30));

    expect(c.orientations).toBe(3);
    expect(inDegrees(c.angles)).toEqual([30, 90, 150, 210, 270, 330]);
  });

  test("divides the circle into sectors of its central angle.", () => {
    expect(new CRegular(4).sectorAngle).toBeCloseTo(Math.PI / 4);
  });
});
