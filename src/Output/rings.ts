import type Polygon from "../geometry/Polygon";
import type { RingCoordinates } from "../geometry/Ring";

/**
 * A polygon's rings as closed coordinate arrays, wound the way the simple
 * feature conventions expect: the exterior ring counterclockwise, holes
 * clockwise. {@link Ring#points} normalizes every ring to counterclockwise, so
 * the holes have to be reversed on the way out.
 * @param polygon the polygon to read
 * @returns the rings, exterior ring first
 */
export const toWoundRings = (polygon: Polygon): RingCoordinates[] =>
  polygon.rings.map((ring, index) => {
    const coordinates = ring.toCoordinates();
    return index === 0 ? coordinates : coordinates.toReversed();
  });
