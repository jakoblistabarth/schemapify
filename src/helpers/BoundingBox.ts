export const boundingBox = (points: [number, number][]) => {
  return points.reduce(
    (boundingBox, point) => {
      boundingBox[0] = Math.min(boundingBox[0], point[0]);
      boundingBox[1] = Math.max(boundingBox[1], point[0]);
      boundingBox[2] = Math.min(boundingBox[2], point[1]);
      boundingBox[3] = Math.max(boundingBox[3], point[1]);
      return boundingBox;
    },
    [Infinity, -Infinity, Infinity, -Infinity],
  );
};
