import BoundingBox from "@/src/helpers/BoundingBox";

export const getInitialZoom = (bbox: BoundingBox): number => {
  const [xMin, xMax, yMin, yMax] = bbox.bounds;
  const width = xMax - xMin;
  const height = yMax - yMin;
  const viewportWidth = window.innerWidth || 800;
  const viewportHeight = window.innerHeight || 600;
  const padding = 200; // pixels of border on each side
  // DeckGL orthographic zoom: zoom=0 means world fits viewport, zoom=1 doubles, etc.
  const scaleX = (viewportWidth - 2 * padding) / width;
  const scaleY = (viewportHeight - 2 * padding) / height;
  const fitScale = Math.min(scaleX, scaleY);
  // log2 scale for DeckGL zoom
  return Math.log2(fitScale);
};
