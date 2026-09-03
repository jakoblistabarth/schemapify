import BoundingBox from "@/src/helpers/BoundingBox";

/** The viewport the data has to fit into, in CSS pixels. */
export type Viewport = { width: number; height: number };

/** Border kept around the data, per side, when the viewport is roomy enough. */
const MAX_PADDING = 200;

/**
 * The deck.gl orthographic zoom at which the data fits the viewport.
 *
 * @param bbox the data's bounding box
 * @param viewport the viewport to fit into, defaulting to the window's
 * @returns the zoom, where 0 means one data unit per pixel
 */
export const getInitialZoom = (
  bbox: BoundingBox,
  viewport: Viewport = {
    width: window.innerWidth || 800,
    height: window.innerHeight || 600,
  },
): number => {
  const [xMin, xMax, yMin, yMax] = bbox.bounds;
  // A subdivision with no extent in one direction would divide by zero.
  const width = xMax - xMin || 1;
  const height = yMax - yMin || 1;
  // The padding is capped at a quarter of the viewport.
  const padding = Math.min(
    MAX_PADDING,
    viewport.width / 4,
    viewport.height / 4,
  );
  // deck.gl orthographic zoom: zoom=0 means world fits viewport, zoom=1 doubles, etc.
  const scaleX = (viewport.width - 2 * padding) / width;
  const scaleY = (viewport.height - 2 * padding) / height;
  const fitScale = Math.min(scaleX, scaleY);
  // log2 scale for deck.gl zoom
  return Math.log2(fitScale);
};
