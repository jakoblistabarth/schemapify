import HalfEdge from "@/src/Dcel/HalfEdge";
import Vertex from "@/src/Dcel/Vertex";
import C from "@/src/c-oriented-schematization/C";
import Configuration from "@/src/c-oriented-schematization/Configuration";
import Sector from "@/src/c-oriented-schematization/Sector";
import Staircase from "@/src/c-oriented-schematization/Staircase";
import { getUnitVector } from "@/src/utilities";
import CDcel, { CVertex } from "@/src/CDcel/";

export enum OrientationClasses {
  AB = "alignedBasic",
  UB = "unalignedBasic",
  E = "evading",
  AD = "alignedDeviating",
  UD = "unalignedDeviating",
}

export enum InflectionType {
  C = "convex",
  R = "reflex",
  B = "both",
}

class CHalfEdge extends HalfEdge {
  tail: CVertex;
  twin?: CHalfEdge;
  prev?: CHalfEdge;
  next?: CHalfEdge;
  assignedDirection?: number;
  isAligning?: boolean;
  class?: OrientationClasses;
  staircase?: Staircase;
  configuration?: Configuration;

  constructor(tail: CVertex, dcel: CDcel) {
    super(tail, dcel);
    this.tail = tail;
  }

  /**
   * Gets the significant Vertex of the HalfEdge.
   * A Vertex is significant if its incident Edges reside in the same sector or adjacent sectors.
   * @returns The significant {@link Vertex} of the {@link HalfEdge}, if it exists.
   */
  getSignificantVertex(): Vertex | undefined {
    const endPoints = this.getEndpoints();
    if (endPoints) return endPoints.find((v) => v.significant);
  }

  /**
   * Gets the associated angle of the HalfEdge, which are the defined as the
   * sector bounds of the sector enclosing the HalfEdge.
   * @returns An Array of angles in radians. It has length one if the {@link HalfEdge} is aligned.
   */
  getAssociatedAngles(sectors: Sector[]): number[] {
    const angle = this.getAngle();
    if (typeof angle !== "number") return [];
    const directions: number[] = [];
    sectors.some(function (sector) {
      if (angle === sector.lower) {
        return directions.push(sector.lower);
      } else if (angle === sector.upper) {
        return directions.push(sector.upper);
      } else if (angle > sector.lower && angle < sector.upper) {
        return directions.push(sector.lower, sector.upper);
      }
    });

    return directions;
  }

  /**
   * Gets the angle of the HalfEdge's assigned direction.
   * @returns The angle in radians.
   */
  getAssignedAngle(sectors: Sector[]): number | undefined {
    if (typeof this.assignedDirection !== "number") return;
    return Math.PI * 2 * (this.assignedDirection / sectors.length);
  }

  /**
   * Gets the sector(s) the HalfEdge is enclosed by.
   * @returns An array of Sectors. It has length 2 if the {@link HalfEdge} is aligned.
   */
  getAssociatedSector(sectors: Sector[]): Sector[] {
    const associatedAngles = this.getAssociatedAngles(sectors);
    const direction = associatedAngles;

    return sectors.reduce((acc: Sector[], sector) => {
      if (
        (direction[0] === sector.lower && direction[1] === sector.upper) ||
        +direction === sector.lower ||
        +direction === sector.upper ||
        +direction === sector.upper - Math.PI * 2
      ) {
        acc.push(sector);
      }
      return acc;
    }, []);
  }

  /**
   * Gets the closest associated angle (one bound of its associated sector)
   * of an unaligned deviating(!) edge in respect to its assigned angle.
   * Needed for constructing the staircase of an unaligned deviating edge.
   * @returns The closest associated angle of an {@link HalfEdge} in respect to its assigned angle.
   */

  // TODO: Where does such function live?
  // within the HalfEdge class or rather within Staircase??
  getClosestAssociatedAngle(c: C): number | undefined {
    const sectors = c.getSectors();
    const associatedSector = this.getAssociatedSector(sectors);
    if (this.class !== OrientationClasses.UD || !associatedSector) return; // TODO: error handling, this function is only meant to be used for unaligned deviating edges
    const sector = associatedSector[0];

    // TODO: refactor: find better solution for last sector and it's upper bound
    // set upperbound of last to Math.PI * 2 ?
    const upper = sector.idx === sectors.length - 1 ? 0 : sector.upper;
    const lower = sector.lower;
    const angle =
      this.getAssignedAngle(sectors) === 0
        ? Math.PI * 2
        : this.getAssignedAngle(sectors);

    return upper + c.getSectorAngle() === angle ? upper : lower;
  }

  /**
   * Determines whether the HalfEdge's assigned Direction is adjacent to its associated sector.
   * @returns A boolean, indicating whether or not the {@link HalfEdge} is deviating.
   */
  isDeviating(sectors: Sector[]): boolean {
    let assignedAngle = this.getAssignedAngle(sectors);
    if (typeof assignedAngle !== "number") return false;
    if (this.isAligned(sectors)) {
      return (
        this.getAssociatedAngles(sectors)[0] !== this.getAssignedAngle(sectors)
      );
    } else {
      const sector = this.getAssociatedSector(sectors)[0];
      //TODO: refactor find better solution for last sector (idx=0)
      if (sector.idx === sectors.length - 1 && assignedAngle === 0)
        assignedAngle = Math.PI * 2;
      return !sector.encloses(assignedAngle);
    }
  }

  getDeviation(sector: Sector): number | undefined {
    const angle = this.getAngle();
    if (typeof angle !== "number") return;
    const diff = Math.abs(angle - sector.lower);
    return diff > Math.PI ? Math.abs(diff - Math.PI * 2) : diff;
  }

  /**
   * Determines whether the HalfEdge is aligned to one of the orientations of C.
   * @returns A boolean, indicating whether or not the {@link HalfEdge} is aligned.
   */
  isAligned(sectors: Sector[]): boolean {
    const isAligned = this.getAssociatedAngles(sectors).length === 1;
    return (this.isAligning = isAligned);
  }

  /**
   * Classifies a HalfEdge and its twin, based on its orientation.
   * The classes depend on the defined set of orientations, the setup of {@link C}.
   */
  classify(c: C): void {
    this.tail.assignDirections(c);

    if (this.class) return; // do not overwrite classification
    const head = this.getHead();

    if (head && head.significant) return; // do not classify a HalfEdge which has a significant head

    const sectors = c.getSectors();
    const associatedSector = this.getAssociatedSector(sectors);
    const sector = associatedSector[0];
    const significantVertex = this.getSignificantVertex() || this.tail;
    const edges = significantVertex
      .getEdgesInSector(sector)
      .filter((edge) => !edge.isAligned(sectors) && !edge.isDeviating(sectors));

    let classification: OrientationClasses;
    if (this.isAligned(sectors)) {
      classification = this.isDeviating(sectors)
        ? OrientationClasses.AD
        : OrientationClasses.AB;
    } else if (this.isDeviating(sectors)) {
      classification = OrientationClasses.UD;
    } else if (edges.length == 2) {
      classification = OrientationClasses.E;
    } else {
      classification = OrientationClasses.UB;
    }

    this.class = classification;
    if (this.twin) this.twin.class = classification;
  }

  getStepLengths(se: number, d1: number, sectors: Sector[]): number[] {
    //TODO: move getStepLengths() to staircase ??
    const associatedAngles = this.getAssociatedAngles(sectors);
    if (!associatedAngles) return [];
    const d2 = associatedAngles.find((angle) => angle !== d1);
    if (typeof d2 !== "number") return [];
    const d1u = getUnitVector(d1);
    const d2u = getUnitVector(d2);

    // create vector of edge
    const v = this.getVector();
    if (!v) return [];
    const vse = v.times(1 / se);

    // solve linear equation for l1 and l2 with Cramer's rule for 2x2 systems
    const det = d1u.dx * d2u.dy - d1u.dy * d2u.dx;
    const detX = vse.dx * d2u.dy - vse.dy * d2u.dx;
    const l1 = detX / det;
    const detY = d1u.dx * vse.dy - d1u.dy * vse.dx;
    const l2 = detY / det;

    return [l1, l2];
  }

  /**
   * Gets the modified tail {@link Vertex}, which is used for calculating the edgeDistance between HalfEdges sharing one Vertex.
   * @param offsetEdge The {@link HalfEdge} of which a part should be ignored.
   * @param offset The distance the offset Vertex should be moved in respect to its (original) tail {@link Vertex}.
   * @returns The Vertex on the edge of which a part should be ignored and from where the edge is considered for calculating the edgeDistance.
   */
  getOffsetVertex(offsetEdge: HalfEdge, offset: number): Vertex | undefined {
    const angle = offsetEdge.getAngle();
    if (typeof angle !== "number") return;
    const pointOffset = offsetEdge.tail.getNewPoint(offset, angle);
    return new Vertex(pointOffset.x, pointOffset.y, offsetEdge.dcel);
  }

  /**
   * Determines the type of the HalfEdge depending on the convexity or reflexivity of its endpoints.
   * @returns A enum, indicating the inflection Type of the {@link HalfEdge}.
   */
  getInflectionType(): InflectionType | undefined {
    const head = this.getHead();
    if (!head || !this.face) return;
    const tailAngle = this.tail.getExteriorAngle(this.face);
    const headAngle = head.getExteriorAngle(this.face);
    if (!tailAngle || !headAngle) return;

    if (tailAngle > 0 && headAngle > 0) return InflectionType.C;
    else if (tailAngle < 0 && headAngle < 0) return InflectionType.R;
    else return InflectionType.B;
  }
}

export default CHalfEdge;
