import Dcel from "../Dcel/Dcel";
import { OrientationClasses } from "../Dcel/HalfEdge";
import Snapshot from "../Snapshot/Snapshot";
import MultiPolygon from "../geometry/MultiPolygon";
import Point from "../geometry/Point";
import Polygon from "../geometry/Polygon";
import Configuration from "./Configuration";
import FaceFaceBoundaryList from "./FaceFaceBoundaryList";
import Staircase from "./Staircase";
import type { Config } from "./schematization.config";
import { config as defaultConfig } from "./schematization.config";

export enum LABEL {
  // TODO: is a default label needed?
  DEFAULT = "default",
  LOAD = "loadData",
  SUBDIVIDE = "subdivide",
  CLASSIFY = "classify",
  STAIRCASEREGIONS = "staircaseregions",
  STAIRCASE = "staircase",
  SIMPLIFY = "simplify",
}

class CSchematization {
  #dcel: Dcel;
  #config: Config;

  constructor(dcel: Dcel, config: Config = defaultConfig) {
    this.#dcel = dcel;
    this.#config = config;
  }

  /**
   * Classifies all Vertices in the DCEL, adds new Vertices on an HalfEdge which has two significant Vertices.
   * By doing so it is guaranteed that every HalfEdge has at most one significant Vertex.
   */
  classifyVertices(): void {
    this.#dcel.getVertices().forEach((v) => {
      v.isSignificant(this.#config.c.getSectors());
    });

    this.#dcel.getHalfEdges(undefined, true).forEach((edge) => {
      const [tail, head] = edge.getEndpoints();
      if (tail.significant && head.significant) {
        const newPoint = edge.subdivide()?.getHead();
        if (newPoint) newPoint.significant = false;
      }
    });
  }

  classify() {
    const timeStart = performance.now();
    this.classifyVertices();
    this.#dcel.halfEdges.forEach((e) => e.classify(this.#config.c));
    return Snapshot.fromDcel(this.#dcel, {
      label: LABEL.CLASSIFY,
      triggeredAt: timeStart,
      recordedAt: performance.now(),
    });
  }

  /**
   * Returns all Staircases of an DCEL.
   */
  getStaircases(): Staircase[] {
    return this.#dcel
      .getHalfEdges()
      .map((edge) => edge.staircase)
      .filter((staircase): staircase is Staircase => !!staircase);
  }

  addStaircases() {
    // create staircase for every pair of edges
    this.#dcel.getHalfEdges(undefined, true).forEach((edge) => {
      if (edge.class === OrientationClasses.AB) return;
      if (
        edge.getSignificantVertex() &&
        edge.getSignificantVertex() !== edge.tail &&
        edge.twin
      )
        edge = edge.twin;
      edge.staircase = new Staircase(edge, this.#config);
    });
  }

  calculateStaircases() {
    // calculate edgedistance and stepnumber for deviating edges first (p. 18)
    const staircasesOfDeviatingEdges = this.getStaircases().filter(
      (staircase) =>
        staircase.edge.class === OrientationClasses.AD ||
        staircase.edge.class === OrientationClasses.UD,
    );
    this.setEdgeDistances(staircasesOfDeviatingEdges);
    this.setSes(
      staircasesOfDeviatingEdges.filter(
        (staircase) => staircase.interferesWith.length > 0,
      ),
    );

    // calculate edgedistance and stepnumber for remaining edges
    const staircasesOther = this.getStaircases().filter(
      (staircase) =>
        staircase.edge.class !== OrientationClasses.AD &&
        staircase.edge.class !== OrientationClasses.UD,
    );
    this.setEdgeDistances(staircasesOther);
    this.setSes(
      staircasesOther.filter(
        (staircase) => staircase.interferesWith.length > 0,
      ),
    );
  }

  setEdgeDistances(staircases: Staircase[]) {
    // TODO: make sure the edgedistance cannot be too small?
    // To account for topology error ("Must Be Larger Than Cluster tolerance"), when minimum distance between points is too small
    // see: https://pro.arcgis.com/en/pro-app/latest/help/editing/geodatabase-topology-rules-for-polygon-features.htm

    // check if any point of a region is within another staircase region
    for (const staircase of staircases) {
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
        const eStaircaseEpsilon = this.#config.staircaseEpsilon;
        const e_staircaseSe = e_.staircase?.se;
        const eLength = e.getLength();
        if (
          e.tail !== e_.tail &&
          e.tail !== e_.getHead() &&
          e.getHead() !== e_.getHead() &&
          e.getHead() !== e_.tail
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
          const v = e
            .getEndpoints()
            .find((endpoint) => e_.getEndpoints().indexOf(endpoint) >= 0); // get common vertex
          e = e.tail !== v && e.twin ? e.twin : e;
          e_ = e_.tail !== v && e_.twin ? e_.twin : e_;
          const e_angle = e_.getAngle();
          if (
            typeof e_angle !== "number" ||
            !e
              .getAssociatedSector(this.#config.c.getSectors())
              .some((sector) => sector.encloses(e_angle))
          )
            return;
          staircase.interferesWith.push(e_);

          // "However, if e and e' do share a vertex, then we must again look at the classification."
          let de = undefined;
          switch (e.class) {
            case OrientationClasses.UB: {
              // "If e' is aligned, then we ignore a fraction of (1 − ε)/2 of e'."
              // "If e' is unaligned, then we ignore a fraction of e' equal to the length of the first step."
              // "In other words, we ignore a fraction of 1/(se' − 1) [of e']."
              if (e_.class === OrientationClasses.AD) {
                const offset = (1 - eStaircaseEpsilon) / 2;
                const vertexOffset = e.getOffsetVertex(e_, offset);
                de = vertexOffset?.distanceToEdge(e);
              } else {
                if (!e_staircaseSe) return;
                const offset = 1 / (e_staircaseSe - 1);
                const vertexOffset = e.getOffsetVertex(e_, offset);
                de = vertexOffset?.distanceToEdge(e);
              }
              break;
            }
            case OrientationClasses.E: {
              // "If e' is an evading edge, we ignore the first half of e (but not of e')."
              // "If e' is a deviating edge, we treat it as if e were an unaligned basic edge."
              if (typeof eLength !== "number") return;
              if (e_.class === OrientationClasses.E) {
                const vertexOffset = e.getOffsetVertex(e, (eLength * 1) / 2);
                de = vertexOffset?.distanceToEdge(e_);
              } else {
                // AD or UD
                if (typeof e_staircaseSe !== "number") return;
                const offset = 1 / (e_staircaseSe - 1);
                const vertexOffset = e.getOffsetVertex(e_, offset);
                de = vertexOffset?.distanceToEdge(e);
              }
              break;
            }
            case OrientationClasses.AD: {
              const offset = (1 - eStaircaseEpsilon) / 2;
              const vertexOffset = e.getOffsetVertex(e, offset);
              de = vertexOffset?.distanceToEdge(e_);
              break;
            }
            case OrientationClasses.UD: {
              if (typeof eLength !== "number") return;
              const vertexOffset = e.getOffsetVertex(e, (eLength * 1) / 3);
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
   * @param staircases
   * @returns
   */
  setSes(staircases: Staircase[]) {
    for (const staircase of staircases) {
      staircase.setSe(this.#config.c.getSectors());
    }
  }

  replaceEdgesWithStaircases() {
    this.#dcel.getHalfEdges().forEach((edge) => {
      if (!edge.staircase) return;
      const stepPoints = edge.staircase.getStaircasePoints().slice(1, -1); // TODO: use .points instead
      let edgeToSubdivide = edge;
      for (const p of stepPoints) {
        const dividedEdge = edgeToSubdivide.subdivide(new Point(p.x, p.y));
        if (!dividedEdge) return;
        if (dividedEdge.next) edgeToSubdivide = dividedEdge.next;
      }
    });

    // assign class AB to all edges of just created staircases
    this.#dcel
      .getHalfEdges()
      .forEach((edge) => (edge.class = OrientationClasses.AB));
  }

  /**
   * Removes all vertices of the DCEL which are collinear, hence superfluous:
   * they can be removed without changing the visual geometry of the DCEL.
   */
  removeSuperfluousVertices(): void {
    const superfluousVertices = this.#dcel.getVertices().filter((v) => {
      if (v.edges.length != 2) return false;
      const angle = v.edges
        .map((h) => h.getAngle() ?? Infinity)
        .reduce((acc, h) => Math.abs(acc - h), 0);
      // QUESTION: how to deal with precision for trigonometry in general?
      const hasOpposingEdges = Math.abs(Math.PI - angle) < 0.00000001;
      return hasOpposingEdges;
    });
    superfluousVertices.forEach((v) => v.remove());
  }

  preProcess() {
    const timeStart = performance.now();
    const loaded = Snapshot.fromDcel(this.#dcel, {
      label: LABEL.LOAD,
      triggeredAt: timeStart,
      recordedAt: performance.now(),
    });
    const time1 = performance.now();
    this.splitEdges();
    const subdivided = Snapshot.fromDcel(this.#dcel, {
      label: LABEL.SUBDIVIDE,
      triggeredAt: time1,
      recordedAt: performance.now(),
    });
    return [loaded, subdivided];
  }

  constrainAngles() {
    const t0 = performance.now();
    this.classify();
    this.addStaircases();
    this.calculateStaircases();
    const staircaseRegions = Snapshot.fromDcel(this.#dcel, {
      label: LABEL.STAIRCASEREGIONS,
      triggeredAt: t0,
      recordedAt: performance.now(),
      additionalData: { staircaseRegions: this.staircaseRegionsToGeometry() },
    });
    const t1 = performance.now();
    this.replaceEdgesWithStaircases();
    const staircases = Snapshot.fromDcel(this.#dcel, {
      label: LABEL.STAIRCASE,
      triggeredAt: t1,
      recordedAt: performance.now(),
    });
    return [staircaseRegions, staircases];
  }

  simplify() {
    const t0 = performance.now();

    this.removeSuperfluousVertices();

    // TODO: is not yet returned
    Snapshot.fromDcel(this.#dcel, {
      label: LABEL.SIMPLIFY,
      triggeredAt: t0,
      recordedAt: performance.now(),
    });

    const t1 = performance.now();
    const faceFaceBoundaryList = new FaceFaceBoundaryList(this.#dcel);
    this.#dcel.faceFaceBoundaryList = faceFaceBoundaryList;
    this.createConfigurations();

    for (let index = 0; index < 0; index++) {
      const pair =
        this.#dcel.faceFaceBoundaryList.getMinimalConfigurationPair();
      pair?.doEdgeMove();
    }

    return Snapshot.fromDcel(this.#dcel, {
      label: LABEL.SIMPLIFY,
      triggeredAt: t1,
      recordedAt: performance.now(),
    });
  }

  schematize() {
    return [this.preProcess(), this.constrainAngles(), this.simplify()].flat();
  }

  /**
   * Sets ε, a constant threshold for the maximum edge length within a DCEL, in the DCEL's config object.
   * @param lambda A constant factor.
   * @returns Epsilon. The maximum length of a {@link HalfEdge}.
   */
  setEpsilon(lambda: number): number | undefined {
    return this.#config
      ? (this.#config.epsilon = this.#dcel.getDiameter() * lambda)
      : undefined;
  }

  /**
   * Subdivide all edges of an DCEL so that no edges are longer than the defined threshold.
   * @param threshold
   * @returns A subdivided {@link Dcel}.
   */
  splitEdges(threshold = this.#config?.epsilon): Dcel | undefined {
    if (!threshold) return;
    this.#dcel.getBoundedFaces().forEach((f) => {
      const edges = f.getEdges();
      if (!edges) return;
      edges.forEach((e) => {
        e.subdivideToThreshold(threshold);
      });
    });
    return this.#dcel;
  }

  /**
   * Creates Configurations for all valid edges.
   */
  createConfigurations() {
    this.#dcel.getHalfEdges().forEach((edge) => {
      if (edge.getEndpoints().every((vertex) => vertex.edges.length <= 3))
        edge.configuration = new Configuration(edge);
    });
  }

  staircaseRegionsToGeometry(): MultiPolygon[] {
    return this.getStaircases().map((staircase): MultiPolygon => {
      const region = staircase.region.exteriorRing;

      const properties = {
        uuid: staircase.edge.uuid,
        class: staircase.edge.class,
        interferesWith: staircase.interferesWith
          .map((e) => e.getUuid(5))
          .join(" ,"),
      };

      return new MultiPolygon(
        [new Polygon([region])],
        properties.uuid,
        properties,
      );
    });
  }
}

export default CSchematization;
