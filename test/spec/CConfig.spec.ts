import {
  createC,
  formatAngles,
  parseAngles,
} from "@/src/c-oriented-schematization/CConfig";
import { degreesToRadians } from "@/src/utilities";
import { describe, expect, test } from "vitest";

describe("Reading a C's angles from degrees", () => {
  test("converts each entry to radians.", () => {
    expect(parseAngles("0, 30, 90, 150")).toEqual(
      [0, 30, 90, 150].map(degreesToRadians),
    );
  });

  test("ignores the empty entries a half-typed list leaves behind.", () => {
    expect(parseAngles("0, 30, ")).toEqual([0, 30].map(degreesToRadians));
    expect(parseAngles("")).toEqual([]);
  });

  test("keeps negative and fractional angles.", () => {
    expect(parseAngles("-45, 22.5")).toEqual([-45, 22.5].map(degreesToRadians));
  });

  test("names the entry it could not read.", () => {
    expect(() => parseAngles("0, abc, 90")).toThrow(/got "abc"/);
  });
});

describe("Writing a C's angles back as degrees", () => {
  test("is the inverse of reading them.", () => {
    expect(formatAngles(parseAngles("0, 30, 90, 150"))).toBe("0, 30, 90, 150");
  });

  test("rounds away the float noise of the round trip.", () => {
    // 30° through radians and back is 30.000000000000004 without the rounding.
    expect(formatAngles([degreesToRadians(30)])).toBe("30");
  });

  test("survives a trip through createC, which completes the set.", () => {
    const c = createC({ type: "irregular", angles: parseAngles("0, 30") });

    expect(formatAngles(c.angles)).toBe("0, 30, 180, 210");
  });
});
