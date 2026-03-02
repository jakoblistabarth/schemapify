import Dcel from "../Dcel/Dcel";
import HalfEdge from "../Dcel/HalfEdge";
import Generator from "../Schematization/Generator";
import { Orientation } from "./HalfEdgeClassGenerator";
import { getAssociatedSector, getSignificantVertex } from "./HalfEdgeUtils";
import Staircase from "./Staircase";
import { CStyle } from "./schematization.style";

class StaircaseGenerator implements Generator {
  sigificantVertices: number[];
  halfEdgeClassifications: Map<
    number,
    { orientation: Orientation; assignedDirection: number }
  >;
  style: CStyle;

  constructor(
    significantVertices: number[],
    halfEdgeClassifications: Map<
      number,
      { orientation: Orientation; assignedDirection: number }
    >,
    style: CStyle,
  ) {
    this.sigificantVertices = significantVertices;
    this.halfEdgeClassifications = halfEdgeClassifications;
    this.style = style;
  }

  /**
   * Adds a staircase to every edge of the {@link DCEL}.
   * @param input The {@link Dcel} to add staircases to.
   */
  public run(input: Dcel) {
    // create staircase for every pair of edges
    const staircases = input
      .getHalfEdges(true)
      .reduce<Map<number, Staircase>>((acc, edge) => {
        const significantVertex = getSignificantVertex(
          edge,
          this.sigificantVertices,
        );
        const edgeId =
          typeof edge.id === "number" && edge.id > 0 ? edge.id : undefined;
        const edgeClass =
          edgeId !== undefined
            ? this.halfEdgeClassifications.get(edgeId)?.orientation
            : undefined;
        const assignedDirection =
          edgeId !== undefined
            ? this.halfEdgeClassifications.get(edgeId)?.assignedDirection
            : undefined;
        if (
          !edgeClass ||
          edgeClass === Orientation.AB ||
          typeof assignedDirection !== "number"
        )
          return acc;
        if (
          edgeId !== undefined &&
          this.sigificantVertices.includes(edgeId) &&
          significantVertex !== edge.tail &&
          edge.twin
        )
          edge = edge.twin;
        if (edge.id === undefined) return acc;
        return acc.set(
          edge.id,
          new Staircase(
            edge,
            edgeClass,
            assignedDirection,
            significantVertex,
            this.style,
          ),
        );
      }, new Map());

    // should this rather return a new map?
    this.calculateStaircases(staircases);

    return staircases;
  }

  /**
   * Gets the position ({@link Point}), which is used for calculating the edgeDistance between HalfEdges sharing one Vertex.
   * @param offsetEdge The {@link HalfEdge} of which a part should be ignored.
   * @param offset The distance the offset Vertex should be moved in respect to its (original) tail {@link Vertex}.
   * @returns The {@link Point} on the edge of which a part should be ignored and from where the edge is considered for calculating the edgeDistance.
   */
  private getOffsetPoint(offsetEdge: HalfEdge, offset: number) {
    const angle = offsetEdge.getAngle();
    if (typeof angle !== "number") return;
    const pointOffset = offsetEdge.tail.getNewPoint(offset, angle);
    return pointOffset;
  }

  /**
   * Calculates and sets the edge distance and se number of all staircases of a {@link Dcel}.
   * @param input The {@link Dcel} to calculate staircases for.
   */
  //TODO: rename to calculateStaircaseParameters
  private calculateStaircases(staircases: Map<number, Staircase>) {
    // calculate edgedistance and stepnumber for deviating edges first (p. 18)
    const staircasesOfDeviatingEdges = new Map(
      [...staircases.entries()].filter(([, staircase]) => {
        const id =
          typeof staircase.edge.id === "number" && staircase.edge.id > 0
            ? staircase.edge.id
            : undefined;
        return (
          (id !== undefined &&
            this.halfEdgeClassifications.get(id)?.orientation ===
              Orientation.AD) ||
          (id !== undefined &&
            this.halfEdgeClassifications.get(id)?.orientation ===
              Orientation.UD)
        );
      }),
    );
    this.setEdgeDistances(staircasesOfDeviatingEdges);
    this.setSes(
      [...staircasesOfDeviatingEdges.values()].filter(
        (staircase) => staircase.interferesWith.length > 0,
      ),
    );

    // calculate edgedistance and stepnumber for remaining edges
    const staircasesOther = new Map(
      [...staircases.entries()].filter(([, staircase]) => {
        const id =
          typeof staircase.edge.id === "number" && staircase.edge.id > 0
            ? staircase.edge.id
            : undefined;
        return !(
          id !== undefined &&
          (this.halfEdgeClassifications.get(id)?.orientation ===
            Orientation.AD ||
            this.halfEdgeClassifications.get(id)?.orientation ===
              Orientation.UD)
        );
      }),
    );
    this.setEdgeDistances(staircasesOther);
    this.setSes(
      [...staircasesOther.values()].filter(
        (staircase) => staircase.interferesWith.length > 0,
      ),
    );
  }

  /**
   * Set the edgedistance for each staircase of a given array of staircases.
   * @param staircases The array of staircases to set the edgedistance for.
   */
  private setEdgeDistances(staircases: Map<number, Staircase>) {
    // TODO: make sure the edgedistance cannot be too small?
    // To account for topology error ("Must Be Larger Than Cluster tolerance"), when minimum distance between points is too small
    // see: https://pro.arcgis.com/en/pro-app/latest/help/editing/geodatabase-topology-rules-for-polygon-features.htm

    // check if any point of a region is within another staircase region
    for (const staircase of [...staircases.values()]) {
      staircases.forEach((staircase_) => {
        if (staircase_ === staircase) return;
        if (
          staircase.region.exteriorRing.points.every(
            (point) => !point.isInPolygon(staircase_.region),
          )
        )
          return;

        let e = staircase.edge;
        let e_ = staircase_.edge;
        const eStaircaseEpsilon = this.style.staircaseEpsilon;
        const e_staircaseSe =
          typeof e_.id === "number" && e_.id > 0
            ? staircases.get(e_.id)?.se
            : undefined;
        const eLength = e.getLength();
        if (
          e.tail !== e_.tail &&
          e.tail !== e_.head &&
          e.head !== e_.head &&
          e.head !== e_.tail
        ) {
          // "If the compared regions' edges do not have a vertex in common,
          // de is is simply the minimal distance between the edges."
          const de = e.distanceToEdge(e_);
          if (typeof de === "number") {
            staircase.de = de;
            staircase.interferesWith.push(e_);
          }
        } else {
          // "If e and e' share a vertex v, they interfere only if the edges reside in the same sector with respect to v."
          const v = e.endpoints.find(
            (endpoint) => e_.endpoints.indexOf(endpoint) >= 0,
          ); // get common vertex
          e = e.tail !== v && e.twin ? e.twin : e;
          e_ = e_.tail !== v && e_.twin ? e_.twin : e_;
          const eLineSegment = e.toLineSegment();
          const e_lineSegment = e_.toLineSegment();
          const e_angle = e_.getAngle();
          if (
            typeof e_angle !== "number" ||
            !getAssociatedSector(e, this.style.c.sectors).some((sector) =>
              sector.encloses(e_angle),
            )
          )
            return;
          staircase.interferesWith.push(e_);

          // "However, if e and e' do share a vertex, then we must again look at the classification."
          let de = undefined;
          const orientation =
            e.id !== undefined
              ? this.halfEdgeClassifications.get(e.id)?.orientation
              : undefined;
          const orientation_ =
            e_.id !== undefined
              ? this.halfEdgeClassifications.get(e_.id)?.orientation
              : undefined;
          switch (orientation) {
            case Orientation.UB: {
              // "If e' is aligned, then we ignore a fraction of (1 − ε)/2 of e'."
              // "If e' is unaligned, then we ignore a fraction of e' equal to the length of the first step."
              // "In other words, we ignore a fraction of 1/(se' − 1) [of e']."
              if (orientation_ === Orientation.AD) {
                const offset = (1 - eStaircaseEpsilon) / 2;
                const pointOffset = this.getOffsetPoint(e_, offset);
                if (!eLineSegment || !pointOffset) return;
                de = pointOffset?.distanceToLineSegment(eLineSegment);
              } else {
                if (!e_staircaseSe) return;
                const offset = 1 / (e_staircaseSe - 1);
                const pointOffset = this.getOffsetPoint(e_, offset);
                if (!eLineSegment || !pointOffset) return;
                de = pointOffset?.distanceToLineSegment(eLineSegment);
              }
              break;
            }
            case Orientation.E: {
              // "If e' is an evading edge, we ignore the first half of e (but not of e')."
              // "If e' is a deviating edge, we treat it as if e were an unaligned basic edge."
              if (typeof eLength !== "number") return;
              if (orientation_ === Orientation.E) {
                const pointOffset = this.getOffsetPoint(e, (eLength * 1) / 2);
                if (!e_lineSegment || !pointOffset) return;
                de = pointOffset?.distanceToLineSegment(e_lineSegment);
              } else {
                // AD or UD
                if (typeof e_staircaseSe !== "number") return;
                const offset = 1 / (e_staircaseSe - 1);
                const pointOffset = this.getOffsetPoint(e_, offset);
                if (!e_lineSegment || !pointOffset) return;
                de = pointOffset?.distanceToLineSegment(e_lineSegment);
              }
              break;
            }
            case Orientation.AD: {
              const offset = (1 - eStaircaseEpsilon) / 2;
              const pointOffset = this.getOffsetPoint(e, offset);
              if (!e_lineSegment || !pointOffset) return;
              de = pointOffset?.distanceToLineSegment(e_lineSegment);
              break;
            }
            case Orientation.UD: {
              if (typeof eLength !== "number") return;
              const pointOffset = this.getOffsetPoint(e, (eLength * 1) / 3);
              if (!e_lineSegment || !pointOffset) return;
              de = pointOffset?.distanceToLineSegment(e_lineSegment);
              break;
            }
          }
          if (typeof de === "number") staircase.de = de;
        }
      });
    }
  }

  /**
   * Calculate and set se, defined as "the number of steps a {@link Staircase} must use"
   * for each staircase of a given array of staircases.
   * @param staircases The array of staircases to set se for.
   */
  private setSes(staircases: Staircase[]) {
    for (const staircase of staircases) {
      staircase.setSe(this.style.c.sectors);
    }
  }
}

export default StaircaseGenerator;
