import Dcel from "../Dcel/Dcel";
import HalfEdge from "../Dcel/HalfEdge";
import Vertex from "../Dcel/Vertex";
import Generator from "../Schematization/Generator";
import { OrientationClasses } from "./HalfEdgeClassGenerator";
import { getAssociatedSector, getSignificantVertex } from "./HalfEdgeUtils";
import Staircase from "./Staircase";
import { CStyle } from "./schematization.style";

class StaircaseGenerator implements Generator {
  sigificantVertices: string[];
  halfEdgeClasses: Map<string, OrientationClasses>;
  style: CStyle;

  constructor(
    significantVertices: string[],
    halfEdgeClasses: Map<string, OrientationClasses>,
    style: CStyle,
  ) {
    this.sigificantVertices = significantVertices;
    this.halfEdgeClasses = halfEdgeClasses;
    this.style = style;
  }

  /**
   * Adds a staircase to every edge of the {@link DCEL}.
   * @param input The {@link Dcel} to add staircases to.
   */
  public run(input: Dcel) {
    // create staircase for every pair of edges
    const staircases = input
      .getHalfEdges(undefined, true)
      .reduce<Map<string, Staircase>>((acc, edge) => {
        const significantVertex = getSignificantVertex(
          edge,
          this.sigificantVertices,
        );
        const edgeClass = this.halfEdgeClasses.get(edge.uuid);
        if (!edgeClass || edgeClass === OrientationClasses.AB) return acc;
        if (
          this.sigificantVertices.includes(edge.uuid) &&
          significantVertex !== edge.tail &&
          edge.twin
        )
          edge = edge.twin;
        return acc.set(
          edge.uuid,
          new Staircase(edge, edgeClass, significantVertex, this.style),
        );
      }, new Map());

    // should this rather return a new map?
    this.calculateStaircases(staircases);

    return staircases;
  }

  /**
   * Gets the modified tail {@link Vertex}, which is used for calculating the edgeDistance between HalfEdges sharing one Vertex.
   * @param offsetEdge The {@link HalfEdge} of which a part should be ignored.
   * @param offset The distance the offset Vertex should be moved in respect to its (original) tail {@link Vertex}.
   * @returns The Vertex on the edge of which a part should be ignored and from where the edge is considered for calculating the edgeDistance.
   */
  private getOffsetVertex(offsetEdge: HalfEdge, offset: number) {
    const angle = offsetEdge.getAngle();
    if (typeof angle !== "number") return;
    const pointOffset = offsetEdge.tail.getNewPoint(offset, angle);
    return new Vertex(pointOffset.x, pointOffset.y, offsetEdge.dcel);
  }

  /**
   * Calculates and sets the edge distance and se number of all staircases of a {@link Dcel}.
   * @param input The {@link Dcel} to calculate staircases for.
   */
  //TODO: rename to calculateStaircaseParameters
  private calculateStaircases(staircases: Map<string, Staircase>) {
    // calculate edgedistance and stepnumber for deviating edges first (p. 18)
    const staircasesOfDeviatingEdges = new Map(
      [...staircases.entries()].filter(
        ([, staircase]) =>
          this.halfEdgeClasses.get(staircase.edge.uuid) ===
            OrientationClasses.AD ||
          this.halfEdgeClasses.get(staircase.edge.uuid) ===
            OrientationClasses.UD,
      ),
    );
    this.setEdgeDistances(staircasesOfDeviatingEdges);
    this.setSes(
      [...staircasesOfDeviatingEdges.values()].filter(
        (staircase) => staircase.interferesWith.length > 0,
      ),
    );

    // calculate edgedistance and stepnumber for remaining edges
    const staircasesOther = new Map(
      [...staircases.entries()].filter(
        ([, staircase]) =>
          this.halfEdgeClasses.get(staircase.edge.uuid) !==
            OrientationClasses.AD &&
          this.halfEdgeClasses.get(staircase.edge.uuid) !==
            OrientationClasses.UD,
      ),
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
  private setEdgeDistances(staircases: Map<string, Staircase>) {
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
        const e_staircaseSe = staircases.get(e_.uuid)?.se;
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
          switch (this.halfEdgeClasses.get(e.uuid)) {
            case OrientationClasses.UB: {
              // "If e' is aligned, then we ignore a fraction of (1 − ε)/2 of e'."
              // "If e' is unaligned, then we ignore a fraction of e' equal to the length of the first step."
              // "In other words, we ignore a fraction of 1/(se' − 1) [of e']."
              if (this.halfEdgeClasses.get(e_.uuid) === OrientationClasses.AD) {
                const offset = (1 - eStaircaseEpsilon) / 2;
                const vertexOffset = this.getOffsetVertex(e_, offset);
                de = vertexOffset?.distanceToEdge(e);
              } else {
                if (!e_staircaseSe) return;
                const offset = 1 / (e_staircaseSe - 1);
                const vertexOffset = this.getOffsetVertex(e_, offset);
                de = vertexOffset?.distanceToEdge(e);
              }
              break;
            }
            case OrientationClasses.E: {
              // "If e' is an evading edge, we ignore the first half of e (but not of e')."
              // "If e' is a deviating edge, we treat it as if e were an unaligned basic edge."
              if (typeof eLength !== "number") return;
              if (this.halfEdgeClasses.get(e_.uuid) === OrientationClasses.E) {
                const vertexOffset = this.getOffsetVertex(e, (eLength * 1) / 2);
                de = vertexOffset?.distanceToEdge(e_);
              } else {
                // AD or UD
                if (typeof e_staircaseSe !== "number") return;
                const offset = 1 / (e_staircaseSe - 1);
                const vertexOffset = this.getOffsetVertex(e_, offset);
                de = vertexOffset?.distanceToEdge(e);
              }
              break;
            }
            case OrientationClasses.AD: {
              const offset = (1 - eStaircaseEpsilon) / 2;
              const vertexOffset = this.getOffsetVertex(e, offset);
              de = vertexOffset?.distanceToEdge(e_);
              break;
            }
            case OrientationClasses.UD: {
              if (typeof eLength !== "number") return;
              const vertexOffset = this.getOffsetVertex(e, (eLength * 1) / 3);
              de = vertexOffset?.distanceToEdge(e_);
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
