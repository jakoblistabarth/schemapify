import Point from "./Point";
import HalfEdge from "../Dcel/HalfEdge";
import LineSegment from "./LineSegment";
import { crawlArray } from "../utilities";
import Ring from "./Ring";

/**
 * Class representing a 2-dimensional polygon.
 * It is defined by its {@link Ring}s.
 */
class Polygon {
  /**
   * An array of {@link Ring}s.
   * The first ring is always the exterior ring (the polygon's boundary).
   * Optionally, further rings are inner rings (holes).
   */
  rings: Ring[];

  constructor(rings: Ring[]) {
    this.rings = rings;
  }

  /**
   * Calculates the area of the irregular polyon defined by a set of points.
   * TODO: add credits!
   * @param points An array of Points, which has to be sorted (either clockwise or counter-clockwise).
   * @returns A number indicating the area of the polygon.
   */
  get area() {
    return this.rings.reduce((sum, ring, idx) => {
      const ringArea = ring.area;
      // subtract area of every hole
      sum += Math.abs(ringArea) * (idx > 0 ? -1 : 1);
      return sum;
    }, 0);
  }

  /**
   * Get the polygon's exterior ring.
   */
  get exteriorRing() {
    return this.rings[0];
  }

  /**
   * Get the polygon's interior rings (holes).
   */
  get interiorRings() {
    return this.rings.slice(1);
  }

  /**
   * Get the polygon's exterior line segments.
   */
  get exteriorLineSegments() {
    return this.exteriorRing.points.map(
      (p, idx) =>
        new LineSegment(p, crawlArray(this.exteriorRing.points, idx, +1)),
    );
  }

  /**
   * Checks for intersections with a given edge.
   * Currently only considers the exterior ring.
   * @param edge
   * @returns An array of {@link Point}s where the edge intersects the polygon.
   */
  getIntersections(edge: HalfEdge) {
    return this.exteriorLineSegments.reduce((acc: Point[], boundaryEdge) => {
      const intersection = edge
        .toLineSegment()
        ?.intersectsLineSegment(boundaryEdge);
      if (intersection && acc.every((point) => !point.equals(intersection)))
        acc.push(intersection);
      return acc;
    }, []);
  }

  /**
   * Creates a polygon from an array of coordinates.
   * @param coordinates The coordinates of the polygon.
   * @returns A new Polygon instance.
   */
  static fromCoordinates(coordinates: [number, number][][]) {
    const rings = coordinates.map(
      (ring) => new Ring(ring.map(([x, y]) => new Point(x, y))),
    );

    return new Polygon(rings);
  }
}

export default Polygon;
