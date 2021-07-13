import Vertex from "../DCEL/Vertex";
import VertexC from "./VertexC";
import HalfEdge, { EdgeClasses } from "../DCEL/HalfEdge";
import Sector from "../orientation-restriction/Sector";
import Staircase from "../orientation-restriction/Staircase";
import { getUnitVector } from "../utilities";
import Dcel from "../DCEL/Dcel";
import DcelC from "./DcelC";

class HalfEdgeC extends HalfEdge {
  dcel: DcelC;
  isAligning: boolean;
  class: EdgeClasses;
  staircase: Staircase;
  tail: VertexC;

  constructor(tail: VertexC, dcel: DcelC) {
    super(tail, dcel);
    this.isAligning = undefined;
    this.class = undefined;
    this.staircase = undefined;
  }

  subdivideToThreshold(threshold: number): void {
    const initialHalfEdge: HalfEdgeC = this;
    let currentHalfEdge: HalfEdgeC = initialHalfEdge;

    while (currentHalfEdge != initialHalfEdge.next) {
      if (currentHalfEdge.getLength() < threshold) {
        currentHalfEdge = currentHalfEdge.next;
      } else {
        const newHalfEdge: HalfEdgeC = currentHalfEdge.subdivide();
        currentHalfEdge = newHalfEdge;
      }
    }
  }

  getSignificantVertex(): this["tail"] | undefined {
    const endPoints = this.getEndpoints();
    return endPoints.find((v) => v.significant);
  }

  getAssociatedAngles(): number[] {
    const sectors = this.dcel.config.c.getSectors();
    const angle = this.getAngle();
    let directions: number[] = [];
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

  getAssignedAngle(): number {
    const sectors = this.dcel.config.c.getSectors();
    return Math.PI * 2 * (this.assignedDirection / sectors.length);
  }

  getAssignedDirection(): number {
    return this.assignedDirection;
  }

  getAssociatedSector(): Array<Sector> {
    const sectors = this.dcel.config.c.getSectors();
    const direction = this.getAssociatedAngles();
    return sectors.reduce((acc, sector) => {
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
   *
   * Needed for constructing the staircase of an unaligned deviating edge.
   *
   * @returns closest associated angle of an edge in respect to its assigned angle.
   */

  // TODO: Where does such function live?
  // within the HalfEdge class or rather within Staircase??
  getClosestAssociatedAngle(): number {
    if (this.class !== EdgeClasses.UD) return; // TODO: error handling, this function is only meant to be used for unaligned deviating edges
    const sector = this.getAssociatedSector()[0];

    // TODO: refactor: find better solution for last sector and it's upper bound
    // set upperbound of last to Math.PI * 2 ?
    const upper = sector.idx === this.dcel.config.c.getSectors().length - 1 ? 0 : sector.upper;
    const lower = sector.lower;
    const angle = this.getAssignedAngle() === 0 ? Math.PI * 2 : this.getAssignedAngle();

    return upper + this.dcel.config.c.getSectorAngle() === angle ? upper : lower;
  }

  isAligned(): boolean {
    const isAligned = this.getAssociatedAngles().length === 1;
    return (this.isAligning = isAligned);
  }

  isDeviating(): boolean {
    // an angle needs to be already set for this halfedge, TODO: Error handling?
    if (this.isAligned()) {
      return this.getAssociatedAngles()[0] !== this.getAssignedAngle();
    } else {
      let assignedAngle = this.getAssignedAngle();
      const sector = this.getAssociatedSector()[0];
      //TODO: refactor find better solution for last sector (idx=0)
      if (sector.idx === this.dcel.config.c.getSectors().length - 1 && assignedAngle === 0)
        assignedAngle = Math.PI * 2;
      return !sector.encloses(assignedAngle);
    }
  }

  getDeviation(sector: Sector): number {
    const diff = Math.abs(this.getAngle() - sector.lower);
    return diff > Math.PI ? Math.abs(diff - Math.PI * 2) : diff;
  }

  classify(): EdgeClasses {
    this.getTail().assignDirections();

    if (this.class) return; // do not overwrite classification
    if (this.getHead().significant) return; // do not classify a HalfEdge which has a significant head

    const sector = this.getAssociatedSector()[0];
    const significantVertex = this.getSignificantVertex() || this.getTail();
    const edges = significantVertex
      .getEdgesInSector(sector)
      .filter((edge) => !edge.isAligned() && !edge.isDeviating());

    let classification: EdgeClasses;
    if (this.isAligned()) {
      classification = this.isDeviating() ? EdgeClasses.AD : EdgeClasses.AB;
    } else if (this.isDeviating()) {
      classification = EdgeClasses.UD;
    } else if (edges.length == 2) {
      classification = EdgeClasses.E;
    } else {
      classification = EdgeClasses.UB;
    }

    this.class = classification;
    return (this.twin.class = classification);
  }

  getStepLengths(se: number, d1: number): number[] {
    //TODO: move getStepLengths() to staircase ??
    const d2 = this.getAssociatedAngles().find((angle) => angle !== d1);
    const d1u = getUnitVector(d1);
    const d2u = getUnitVector(d2);

    // create vector of edge
    const [tail, head] = this.getEndpoints();
    const v = [head.x - tail.x, head.y - tail.y];
    const vse = v.map((point) => point / se);

    // solve linear equation for l1 and l2 with cramer's rule for 2x2 systems
    const det = d1u[0] * d2u[1] - d1u[1] * d2u[0];
    const detX = vse[0] * d2u[1] - vse[1] * d2u[0];
    const l1 = detX / det;
    const detY = d1u[0] * vse[1] - d1u[1] * vse[0];
    const l2 = detY / det;

    return [l1, l2];
  }

  /**
   * Gets the modified tail Vertex, which is used for calculating the edgeDistance between HalfEdges sharing one Vertex.
   * @param offsetEdge The edge of which a part should be ignored.
   * @param offset The distance the offset Vertex should be moved in respect to its (original) tail Vertex.
   * @returns The Vertex on the edge of which a part should be ignored and from where the edge is considered for calculating the edgeDistance.
   */
  getOffsetVertex(offsetEdge: HalfEdge, offset: number) {
    const pointOffset = offsetEdge.getTail().getNewPoint(offset, offsetEdge.getAngle());
    return new Vertex(pointOffset.x, pointOffset.y, undefined);
  }
}

export default HalfEdgeC;
