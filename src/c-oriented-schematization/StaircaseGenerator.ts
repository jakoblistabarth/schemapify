import Dcel from "../Dcel/Dcel";
import HalfEdge from "../Dcel/HalfEdge";
import Generator from "../Schematization/Generator";
import { Orientation } from "./HalfEdgeClassGenerator";
import { getAssociatedSector, getSignificantVertex } from "./HalfEdgeUtils";
import { CStyle } from "./schematization.style";
import Staircase from "./Staircase";

class StaircaseGenerator implements Generator {
  sigificantVertices: number[];
  halfEdgeClassifications: Map<
    string,
    { orientation: Orientation; assignedDirection: number }
  >;
  style: CStyle;

  constructor(
    significantVertices: number[],
    halfEdgeClassifications: Map<
      string,
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
    // Create staircase for every pair of edges
    const staircases = input
      .getHalfEdges(true)
      .reduce<Map<number, Staircase>>((acc, edge) => {
        const significantVertex = getSignificantVertex(
          edge,
          this.sigificantVertices,
        );
        // Always process the edge whose head is NOT significant:
        // those have geometrically valid direct classifications.
        if (
          edge.head &&
          typeof edge.head.id === "number" &&
          this.sigificantVertices.includes(edge.head.id) &&
          edge.twin
        )
          edge = edge.twin;
        const edgeCoordKey = edge.coordKey;
        const edgeClass =
          edgeCoordKey !== undefined
            ? this.halfEdgeClassifications.get(edgeCoordKey)?.orientation
            : undefined;
        const assignedDirection =
          edgeCoordKey !== undefined
            ? this.halfEdgeClassifications.get(edgeCoordKey)?.assignedDirection
            : undefined;
        if (
          !edgeClass ||
          edgeClass === Orientation.AB ||
          typeof assignedDirection !== "number"
        )
          return acc;
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

    // Should this rather return a new map?
    this.calculateStaircaseParameters(staircases);

    return staircases;
  }

  /**
   * Gets the position ({@link Point}), which is used for calculating the edge distance between edges sharing one Vertex.
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
  private calculateStaircaseParameters(staircases: Map<number, Staircase>) {
    // Calculate edge distance and step number for deviating edges first (page 18)
    const staircasesOfDeviatingEdges = new Map(
      [...staircases.entries()].filter(([, staircase]) => {
        const coordKey = staircase.edge.coordKey;
        return (
          (coordKey !== undefined &&
            this.halfEdgeClassifications.get(coordKey)?.orientation ===
              Orientation.AD) ||
          (coordKey !== undefined &&
            this.halfEdgeClassifications.get(coordKey)?.orientation ===
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

    // Calculate edge distance and step number for remaining edges
    const staircasesOther = new Map(
      [...staircases.entries()].filter(([, staircase]) => {
        const coordKey = staircase.edge.coordKey;
        return !(
          coordKey !== undefined &&
          (this.halfEdgeClassifications.get(coordKey)?.orientation ===
            Orientation.AD ||
            this.halfEdgeClassifications.get(coordKey)?.orientation ===
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
   * Set the edge distance for each staircase of a given array of staircases.
   * @param staircases The array of staircases to set the edgedistance for.
   */
  private setEdgeDistances(staircases: Map<number, Staircase>) {
    // TO-DO: make sure the edge distance cannot be too small?
    // To account for topology error ("Must Be Larger Than Cluster tolerance"), when minimum distance between points is too small
    // see: https://pro.arcgis.com/en/pro-app/latest/help/editing/geodatabase-topology-rules-for-polygon-features.htm

    // Check if any point of a region is within another staircase region
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
          // de is simply the minimal distance between the edges."
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
          const orientation = e.coordKey
            ? this.halfEdgeClassifications.get(e.coordKey)?.orientation
            : undefined;
          const orientation_ = e_.coordKey
            ? this.halfEdgeClassifications.get(e_.coordKey)?.orientation
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
