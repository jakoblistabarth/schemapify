import { v4 as uuid } from "uuid";
import Sector from "../c-oriented-schematization/Sector";
import Point from "../geometry/Point";
import Dcel from "./Dcel";
import Face from "./Face";
import HalfEdge from "./HalfEdge";

class Vertex extends Point {
  dcel: Dcel;
  uuid: string;
  edges: Array<HalfEdge>;
  significant: boolean;

  constructor(x: number, y: number, dcel: Dcel) {
    super(x, y);
    this.dcel = dcel;
    this.uuid = uuid();
    this.edges = [];
    this.significant = undefined;
  }

  /**
   * Gets the key of a Vertex, based on its coordinates.
   * @param x The x coordinate of the {@link Vertex}.
   * @param y The y coordinate of the {@link Vertex}.
   * @returns A string, holding the {@link Vertex}'s key.
   */
  static getKey(x: number, y: number): string {
    return `${x}/${y}`;
  }

  /**
   * Gets the unique ID of a Vertex.
   * @param stop Defines how many strings of the uuid are returned.
   * @returns A string, holding the {@link Vertex}'s unique ID.
   */
  getUuid(length?: number) {
    // QUESTION: extending classes instead of declaring this method separately for all 3 dcel entities?
    return this.uuid.substring(0, length);
  }

  /**
   * Gets the distance between the Vertex to another.
   * @param p The other Vertex.
   * @returns The distance.
   */
  distanceToVertex(vertex: Vertex): number {
    return this.distanceToPoint(vertex);
  }

  /**
   * Gets the (minimum) distance between the Vertex and a HalfEdge.
   * @credits Adapted from [scottglz](https://github.com/scottglz/distance-to-line-segment/blob/master/index.js)
   * @param edge An {@link HalfEdge} to which the distance is measured.
   * @returns The distance.
   */
  distanceToEdge(edge: HalfEdge): number {
    const [vx, vy] = this.xy();
    const [e1x, e1y] = edge.getTail().xy();
    const [e2x, e2y] = edge.getHead().xy();
    const edx = e2x - e1x;
    const edy = e2y - e1y;
    const lineLengthSquared = edx ** 2 + edy ** 2;

    let t = ((vx - e1x) * edx + (vy - e1y) * edy) / lineLengthSquared;
    if (t < 0) t = 0;
    else if (t > 1) t = 1;

    const ex = e1x + t * edx,
      ey = e1y + t * edy,
      dx = vx - ex,
      dy = vy - ey;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Sorts the incident HalfEdges of the Vertex, either clockwise or counter-clockwise
   * @param clockwise If set to true (default), the {@link HalfEdge}s a sorted clockwise, if set to false they are sorted counter-clockwise.
   * @returns An array containing the sorted {@link HalfEdge}s.
   */
  sortEdges(clockwise: boolean = true): Array<HalfEdge> {
    this.edges = this.edges.sort((a, b) => {
      if (clockwise) return b.getAngle() - a.getAngle();
      else return a.getAngle() - b.getAngle();
    });
    return this.edges;
  }

  /**
   * Removes the vertex and replaces the incident HalfEdges with a new one.
   * Only works on vertices of degree 2 (with a maximum of two incident {@link HalfEdge}s).
   */
  remove(): void {
    if (this.edges.length > 2)
      throw new Error(
        "only vertices of degree 2 or less can be removed, otherwise the topology would be corrupted"
      );
    if (this.dcel.vertices.size === 3) throw new Error("a dcel must not have less than 3 vertices");

    const ex__ = this.edges[0];
    const ex_ = ex__.prev;

    const a = ex__.next;
    const b = a.twin;
    const c = ex_.prev;
    const d = c.twin;

    const f1 = ex__.face;
    const f2 = ex__.twin.face;

    const eTail = c.getHead();
    const eHead = a.getTail();

    const e = this.dcel.makeHalfEdge(eTail, eHead);
    e.twin = this.dcel.makeHalfEdge(eHead, eTail);
    e.twin.twin = e;

    if (f1.edge === ex__ || f1.edge === ex_) f1.edge = e;
    if (f2.edge === ex__.twin || f2.edge === ex_.twin) f2.edge = e.twin;

    f1.replaceInnerEdge(ex__, e);
    f1.replaceInnerEdge(ex_, e);
    f1.replaceInnerEdge(ex__.twin, e.twin);
    f1.replaceInnerEdge(ex_.twin, e.twin);

    f2.replaceInnerEdge(ex__, e);
    f2.replaceInnerEdge(ex_, e);
    f2.replaceInnerEdge(ex__.twin, e.twin);
    f2.replaceInnerEdge(ex_.twin, e.twin);

    e.face = ex__.face;
    e.twin.face = ex__.twin.face;

    e.prev = c;
    c.next = e;
    e.next = a;
    a.prev = e;

    e.twin.prev = b;
    b.next = e.twin;
    e.twin.next = d;
    d.prev = e.twin;

    ex_.twin.remove();
    ex_.remove();
    ex__.twin.remove();
    ex__.remove();
    this.dcel.removeVertex(this);
  }

  /**
   * Removes the specified halfedge from the Array of incident Halfedges of the vertex.
   * @param edge The {@link HalfEdge} to be removed.
   * @returns An Array containing the remaining incident {@link HalfEdge}s.
   */
  removeIncidentEdge(edge: HalfEdge): Array<HalfEdge> {
    const idx = this.edges.indexOf(edge);
    if (idx > -1) {
      this.edges.splice(idx, 1);
    }
    return this.edges;
  }

  /**
   * Determines whether all incident Edges to the Vertex are aligned (to C).
   * @returns A Boolean indicating whether or not all {@link HalfEdge}s are aligned.
   */
  allEdgesAligned(): boolean {
    return this.edges.every((edge) => edge.isAligned());
  }

  /**
   * Determines the significance of the Vertex..
   * @returns A Boolean indicating whether or not the {@link Vertex} is significant.
   */
  isSignificant(): boolean {
    // QUESTION: are vertices with only aligned edges never significant?
    // TODO: move to another class? to not mix dcel and schematization?

    // classify as insignificant if all edges are already aligned
    if (this.allEdgesAligned()) {
      return (this.significant = false);
    }

    // classify as significant if one sector occurs multiple times
    const occupiedSectors = this.edges.map((edge) => edge.getAssociatedSector()).flat();

    const uniqueSectors = occupiedSectors.reduce((acc, sector) => {
      if (!acc.find((accSector) => accSector.idx == sector.idx)) acc.push(sector);
      return acc;
    }, []);

    if (occupiedSectors.length !== uniqueSectors.length) {
      return (this.significant = true);
    }

    // classify as significant if neighbor sectors are not empty
    const isSignificant = uniqueSectors.every((sector) => {
      const [prevSector, nextSector] = sector.getNeighbors();
      return (
        this.getEdgesInSector(prevSector).length > 0 || this.getEdgesInSector(nextSector).length > 0
      );
    });
    return (this.significant = isSignificant);
  }

  /**
   * Returns only incident HalfEdges which lie in the specified sector.
   * @param sector A sector, against which the {@link HalfEdge}s are checked.
   * @returns An array, containing all {@link HalfEdge}s lying in the sector.
   */
  getEdgesInSector(sector: Sector): Array<HalfEdge> {
    return this.edges.filter((edge) => sector.encloses(edge.getAngle()));
  }

  /**
   * Assigns directions to all incident HalfEdges of the Vertex.
   * @returns An Array, holding the assigned directions starting with the direction of the {@link HalfEge} with the smallest angle on the unit circle.
   */
  assignDirections(): number[] {
    const edges = this.sortEdges(false);
    const sectors = this.dcel.config.c.getSectors();

    function getDeviation(edges: HalfEdge[], directions: number[]): number {
      return edges.reduce((deviation, edge, index) => {
        return deviation + edge.getDeviation(sectors[directions[index]]);
      }, 0);
    }

    const validDirections = this.dcel.config.c.getValidDirections(edges.length);

    let minmalDeviation = Infinity;
    let solution: number[] = [];

    validDirections.forEach((directions) => {
      for (let index = 0; index < directions.length; index++) {
        const deviation = getDeviation(edges, directions);

        if (deviation < minmalDeviation) {
          minmalDeviation = deviation;
          solution = [...directions];
        }
        directions.unshift(directions.pop());
      }
    });

    edges.forEach((edge, idx) => (edge.assignedDirection = solution[idx]));
    return solution;
  }

  /**
   * Returns the exterior angle of a DCEL's Vertex.
   * If the {@link Vertex} is convex the exterior angle is positive, if it is reflex, the angle is negative.
   * @param face A {@link Face} the angle is exterior to.
   * @returns An angle in radians.
   */
  getExteriorAngle(face: Face): number {
    return Math.PI - this.getInteriorAngle(face);
  }

  /**
   * Returns the interior angle of a DCEL's Vertex.
   * It is always positive.
   * @credits Adapted from this [stack overflow answer](https://stackoverflow.com/a/12090743).
   * @param face A {@link Face} the angle is interior to.
   * @returns An angle in radians.
   */
  getInteriorAngle(face: Face): number {
    const outgoing = this.edges.find((edges) => edges.face === face);
    const incoming = outgoing.prev;
    const vIncoming = incoming.getVector();
    const vOutgoing = outgoing.getVector();
    return (
      Math.PI -
      Math.atan2(
        vIncoming[0] * vOutgoing[1] - vOutgoing[0] * vIncoming[1],
        vIncoming[0] * vOutgoing[0] + vIncoming[1] * vOutgoing[1]
      )
    );
  }
}

export default Vertex;
