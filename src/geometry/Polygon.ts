import Point from "./Point";
import HalfEdge from "../DCEL/HalfEdge";
import LineSegment from "./LineSegment";
import { crawlArray } from "../utilities";
import Ring from "./Ring";

/**
 * Class representing a 2-dimensional polygon.
 * It is defined by its rings.
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
  get area(): number {
    return this.rings.reduce((sum, ring, idx) => {
      let total = 0;

      for (let i = 0; i < ring.length; i++) {
        const addX = ring.points[i].x;
        const addY = ring.points[i == ring.length - 1 ? 0 : i + 1].y;
        const subX = ring.points[i == ring.length - 1 ? 0 : i + 1].x;
        const subY = ring.points[i].y;

        total += addX * addY * 0.5;
        total -= subX * subY * 0.5;
      }

      // subtract area of every hole
      sum += Math.abs(total) * (idx > 0 ? -1 : 1);
      return sum;
    }, 0);
  }

  get exteriorRing(): (typeof this.rings)[number] {
    return this.rings[0];
  }

  get interiorRings(): typeof this.rings {
    return this.rings.slice(1);
  }

  get exteriorLineSegments(): LineSegment[] {
    return this.exteriorRing.points.map(
      (p, idx) =>
        new LineSegment(p, crawlArray(this.exteriorRing.points, idx, +1)),
    );
  }

  /**
   * Checks for intersections with a given edge.
   * Currently only considers the exterior ring.
   * @param edge
   * @returns
   */
  getIntersections(edge: HalfEdge): Point[] | undefined {
    return this.exteriorLineSegments.reduce((acc: Point[], boundaryEdge) => {
      const intersection = edge
        .toLineSegment()
        ?.intersectsLineSegment(boundaryEdge);
      if (intersection && acc.every((point) => !point.equals(intersection)))
        acc.push(intersection);
      return acc;
    }, []);
  }

  static fromCoordinates(coordinates: [number, number][][]) {
    const rings = coordinates.map(
      (ring) => new Ring(ring.map(([x, y]) => new Point(x, y))),
    );

    return new Polygon(rings);
  }
}

export default Polygon;
