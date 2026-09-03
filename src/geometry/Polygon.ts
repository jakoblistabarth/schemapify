import HalfEdge from "../Dcel/HalfEdge";
import { crawlArray } from "../utilities";
import LineSegment from "./LineSegment";
import Point from "./Point";
import Ring, { type RingCoordinates } from "./Ring";

/** A polygon's rings as plain coordinates, the first one being its exterior ring. */
export type PolygonCoordinates = RingCoordinates[];

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
   * Get the area of the polygon.
   * Calculates the area of the {@link Polygon} by adding (or subtracting) the {@link Ring}s' areas.
   * @returns A number indicating the area of the {@link Polygon}.
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
    const points = this.exteriorRing.points;
    return points
      .slice(0, -1)
      .map((p, idx) => new LineSegment(p, crawlArray(points, idx, +1)));
  }

  /**
   * Checks for intersections with a given edge.
   * Currently only considers the exterior ring.
   * @param edge
   * @returns An array of {@link Point}s where the edge intersects the polygon.
   */
  getIntersections(edge: HalfEdge) {
    const segment = edge.toLineSegment();
    return this.exteriorLineSegments.reduce((acc: Point[], boundaryEdge) => {
      const intersection = segment?.intersectsLineSegment(boundaryEdge);
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
  static fromCoordinates(coordinates: PolygonCoordinates) {
    const rings = coordinates.map(
      (ring) => new Ring(ring.map(([x, y]) => new Point(x, y))),
    );

    return new Polygon(rings);
  }

  /**
   * Creates a polygon from ring coordinates of unknown winding.
   *
   * Every {@link Ring} is re-wrapped so that the counterclockwise ordering its
   * {@link Ring#points} getter enforces is what gets stored. File formats make
   * no promise about ring order, so the readers normalize on the way in rather
   * than leaving every read to reverse.
   * @param coordinates The coordinates of the polygon, exterior ring first.
   * @returns A new Polygon instance.
   */
  static fromUnorderedCoordinates(coordinates: PolygonCoordinates) {
    return new Polygon(
      coordinates.map((positions) => {
        const ring = Ring.fromCoordinates(positions);
        // The closing point is redundant, the constructor re-adds it.
        return new Ring(ring.points.slice(0, -1));
      }),
    );
  }

  /**
   * Reduce the polygon to plain coordinates, the inverse of {@link Polygon.fromCoordinates}.
   * @returns The polygon's rings as coordinates.
   */
  toCoordinates(): PolygonCoordinates {
    return this.rings.map((ring) => ring.toCoordinates());
  }
}

export default Polygon;
