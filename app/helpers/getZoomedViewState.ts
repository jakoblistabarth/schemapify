import type { OrthographicViewState } from "@deck.gl/core";

/** What a zoom button asks for. */
export type ZoomDirection = "in" | "out" | "reset";

/**
 * A view state as deck.gl's orthographic controller leaves it: having zoomed,
 * it records the zoom per axis and keeps `zoom` only for backwards
 * compatibility.
 */
type AxisZoomed = OrthographicViewState & {
  zoomX?: number;
  zoomY?: number;
};

/** The zoom currently in effect, whichever way the controller recorded it. */
const currentZoomOf = ({ zoomX, zoom }: AxisZoomed) =>
  zoomX ?? (typeof zoom === "number" ? zoom : (zoom?.[0] ?? 0));

/**
 * The view state a zoom button should move to.
 *
 * `zoomX` and `zoomY` are both dropped, because the controller reads them in
 * preference to `zoom` and falls back to `zoom` only for an axis whose value is
 * absent. Keeping either one would hold that axis at the old zoom while the new
 * one applies to the other, stretching the data out of proportion.
 * @param current the view state to zoom from
 * @param direction which button was pressed
 * @param initial the fitted view state, which `"reset"` returns to
 * @param transitionDuration how long deck.gl should animate the change, in ms
 * @returns the next view state
 */
export const getZoomedViewState = (
  current: OrthographicViewState,
  direction: ZoomDirection,
  initial: OrthographicViewState,
  transitionDuration = 500,
): OrthographicViewState => {
  const { zoomX, zoomY, ...rest } = current as AxisZoomed;
  void zoomX;
  void zoomY;

  if (direction === "reset") return { ...rest, ...initial, transitionDuration };

  return {
    ...rest,
    zoom: currentZoomOf(current as AxisZoomed) + (direction === "in" ? 1 : -1),
    transitionDuration,
  };
};
