import { getZoomedViewState } from "@/app/helpers/getZoomedViewState";
import { describe, expect, test } from "vitest";

const initial = { target: [10, 20] as [number, number], zoom: -3 };

/** A view state as deck.gl leaves it after a wheel zoom: recorded per axis. */
const afterWheelZoom = {
  target: [10, 20] as [number, number],
  zoom: 2,
  zoomX: 2,
  zoomY: 2,
};

describe("getZoomedViewState", () => {
  test("steps the zoom in and out.", () => {
    expect(getZoomedViewState({ zoom: 4 }, "in", initial).zoom).toBe(5);
    expect(getZoomedViewState({ zoom: 4 }, "out", initial).zoom).toBe(3);
  });

  test("returns to the fitted view on reset.", () => {
    const next = getZoomedViewState(afterWheelZoom, "reset", initial);

    expect(next.zoom).toBe(initial.zoom);
    expect(next.target).toEqual(initial.target);
  });

  test.each(["in", "out", "reset"] as const)(
    "drops both per-axis zooms on %s, so the axes cannot diverge.",
    (direction) => {
      const next = getZoomedViewState(afterWheelZoom, direction, initial);

      // Either one left behind would out-rank `zoom` for its axis and stretch
      // the data, since deck.gl only falls back to `zoom` per missing axis.
      expect(next).not.toHaveProperty("zoomX");
      expect(next).not.toHaveProperty("zoomY");
    },
  );

  test("reads the current zoom from zoomX when the controller set it.", () => {
    // `zoom` lags behind zoomX/zoomY, so stepping from it would jump.
    const next = getZoomedViewState(
      { ...afterWheelZoom, zoom: -99 },
      "in",
      initial,
    );

    expect(next.zoom).toBe(3);
  });

  test("reads the current zoom from an array, as deck.gl reports a split zoom.", () => {
    const next = getZoomedViewState({ zoom: [7, 7] }, "in", initial);

    expect(next.zoom).toBe(8);
  });

  test("keeps the pan position while zooming.", () => {
    const next = getZoomedViewState(
      { ...afterWheelZoom, target: [123, 456] },
      "in",
      initial,
    );

    expect(next.target).toEqual([123, 456]);
  });
});
