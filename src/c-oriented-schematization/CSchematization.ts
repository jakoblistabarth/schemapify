import Dcel from "@/src/Dcel/Dcel";
import { OrientationClasses } from "@/src/Dcel/HalfEdge";
import Schematization, {
  Callback,
  Callbacks,
} from "@/src/Schematization/Schematization";
import SnapshotList from "@/src/Snapshot/SnapshotList";
import MultiPolygon from "@/src/geometry/MultiPolygon";
import Point from "@/src/geometry/Point";
import Polygon from "@/src/geometry/Polygon";
import Configuration from "./Configuration";
import FaceFaceBoundaryList from "./FaceFaceBoundaryList";
import Staircase from "./Staircase";
import type { CStyle } from "./schematization.style";
import { style as defaultStyle } from "./schematization.style";

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

/**
 * A C-oriented schematization process.
 */
class CSchematization implements Schematization {
  style: CStyle;
  callbacks: Callbacks;
  snapshots: SnapshotList;

  constructor(style: CStyle = defaultStyle, callbacks: Callbacks = {}) {
    this.style = style;
    this.callbacks = callbacks;
    this.snapshots = new SnapshotList();
  }

  doAction({
    level,
    ...rest
  }: {
    //TODO: Why is the typing not inferred as for preProcess?
    level: "debug" | "visualize";
  } & Parameters<Callback>[0]): void {
    this.callbacks[level]?.(rest);
  }

  /**
   * Classifies all Vertices in the DCEL.
   * This also adds new Vertices on every HalfEdge which has two significant Vertices.
   * By doing so it is guaranteed that every HalfEdge has at most one significant Vertex.
   */
  classifyVertices(input: Dcel): void {
    input.getVertices().forEach((v) => {
      v.isSignificant(this.style.c.sectors);
    });

    input.getHalfEdges(undefined, true).forEach((edge) => {
      const [tail, head] = edge.endpoints;
      if (tail.significant && head.significant) {
        const newPoint = edge.subdivide()?.head;
        if (newPoint) newPoint.significant = false;
      }
    });
  }

  classify(input: Dcel) {
    const t0 = performance.now();
    this.classifyVertices(input);
    input.halfEdges.forEach((e) => e.classify(this.style.c));
    this.doAction({
      level: "visualize",
      dcel: input,
      label: LABEL.CLASSIFY,
      forSnapshots: {
        snapshotList: this.snapshots,
        triggeredAt: t0,
      },
    });
  }

  /**
   * Get all Staircases of an {@link Dcel}.
   * @param input The {@link Dcel} to get the Staircases from.
   * @returns An array of Staircases.
   */
  getStaircases(input: Dcel) {
    return input
      .getHalfEdges()
      .map((edge) => edge.staircase)
      .filter((staircase): staircase is Staircase => !!staircase);
  }

  /**
   * Adds a staircase to every edge of the {@link DCEL}.
   * @param input The {@link Dcel} to add staircases to.
   */
  addStaircases(input: Dcel) {
    // create staircase for every pair of edges
    input.getHalfEdges(undefined, true).forEach((edge) => {
      if (edge.class === OrientationClasses.AB) return;
      if (
        edge.significantVertex &&
        edge.significantVertex !== edge.tail &&
        edge.twin
      )
        edge = edge.twin;
      edge.staircase = new Staircase(edge, this.style);
    });
  }

  /**
   * Calculate all staircases of a {@link Dcel}.
   * @param input The {@link Dcel} to calculate staircases for.
   */
  calculateStaircases(input: Dcel) {
    // calculate edgedistance and stepnumber for deviating edges first (p. 18)
    const staircasesOfDeviatingEdges = this.getStaircases(input).filter(
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
    const staircasesOther = this.getStaircases(input).filter(
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

  /**
   * Set the edgedistance for each staircase of a given array of staircases.
   * @param staircases The array of staircases to set the edgedistance for.
   */
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
        const eStaircaseEpsilon = this.style.staircaseEpsilon;
        const e_staircaseSe = e_.staircase?.se;
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
            !e
              .getAssociatedSector(this.style.c.sectors)
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
   * @param staircases The array of staircases to set se for.
   */
  setSes(staircases: Staircase[]) {
    for (const staircase of staircases) {
      staircase.setSe(this.style.c.sectors);
    }
  }

  /**
   * Replace all edges of a {@link Dcel} with staircases.
   * @param input The {@link Dcel} to replace the edges with staircases in.
   */
  replaceEdgesWithStaircases(input: Dcel) {
    input.getHalfEdges().forEach((edge) => {
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
    input
      .getHalfEdges()
      .forEach((edge) => (edge.class = OrientationClasses.AB));
  }

  /**
   * Removes all vertices of the DCEL which are collinear, hence superfluous:
   * they can be removed without changing the visual geometry of the DCEL.
   * @param input The DCEL to remove superfluous vertices from.
   */
  removeSuperfluousVertices(input: Dcel) {
    const superfluousVertices = input.getVertices().filter((v) => {
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

  /**
   * Preprocesses a {@link Dcel} by subdividing all edges.
   * @param input The {@link Dcel} to preprocess.
   * @returns The preprocessed {@link Dcel}.
   */
  preProcess(input: Dcel) {
    const t0 = performance.now();
    this.doAction({
      level: "visualize",
      dcel: input,
      label: LABEL.LOAD,
      forSnapshots: { snapshotList: this.snapshots, triggeredAt: t0 },
    });

    const t1 = performance.now();
    this.splitEdges(input);
    this.doAction({
      level: "visualize",
      dcel: input,
      label: LABEL.SUBDIVIDE,
      forSnapshots: { snapshotList: this.snapshots, triggeredAt: t1 },
    });
    return input;
  }

  /**
   * Constrain the angles of a {@link Dcel}.
   * @param input The {@link Dcel} to constrain the angles of.
   * @returns The constrained {@link Dcel}.
   */
  constrainAngles(input: Dcel) {
    const t0 = performance.now();
    this.classify(input);
    this.addStaircases(input);
    this.calculateStaircases(input);
    //TODO: add additional data to Snapshot: staircaseRegions as geometry
    //   additionalData: { staircaseRegions: this.staircaseRegionsToGeometry() },
    this.doAction({
      level: "visualize",
      dcel: input,
      label: LABEL.STAIRCASEREGIONS,
      forSnapshots: { snapshotList: this.snapshots, triggeredAt: t0 },
    });
    const t1 = performance.now();
    this.replaceEdgesWithStaircases(input);
    this.doAction({
      level: "visualize",
      dcel: input,
      label: LABEL.STAIRCASE,
      forSnapshots: { snapshotList: this.snapshots, triggeredAt: t1 },
    });
    return input;
  }

  /**
   * Simplify a {@link Dcel} by removing superfluous vertices and applying edge moves.
   * @param input The {@link Dcel} to simplify.
   * @returns The simplified {@link Dcel}.
   */
  simplify(input: Dcel) {
    const t0 = performance.now();
    this.removeSuperfluousVertices(input);
    this.doAction({
      level: "visualize",
      dcel: input,
      label: LABEL.SIMPLIFY,
      forSnapshots: { snapshotList: this.snapshots, triggeredAt: t0 },
    });

    const t1 = performance.now();
    const faceFaceBoundaryList = new FaceFaceBoundaryList(input);
    input.faceFaceBoundaryList = faceFaceBoundaryList;
    this.createConfigurations(input);

    for (let index = 0; index < 0; index++) {
      const pair = input.faceFaceBoundaryList.getMinimalConfigurationPair();
      pair?.doEdgeMove();
    }

    this.doAction({
      level: "visualize",
      dcel: input,
      label: LABEL.SIMPLIFY,
      forSnapshots: { snapshotList: this.snapshots, triggeredAt: t1 },
    });
    return input;
  }

  /**
   * Run the schematization process on a {@link Dcel}.
   * @param input The {@link Dcel} to run the schematization process on.
   * @returns The schematized {@link Dcel}.
   */
  run(input: Dcel) {
    this.preProcess(input);
    this.constrainAngles(input);
    this.simplify(input);
    return input;
  }

  /**
   * Sets ε, a constant threshold for the maximum edge length within a DCEL, in the DCEL's config object.
   * @param lambda A constant factor.
   * @returns Epsilon. The maximum length of a {@link HalfEdge}.
   */
  setEpsilon(input: Dcel, lambda: number) {
    return this.style
      ? (this.style.epsilon = input.getDiameter() * lambda)
      : undefined;
  }

  /**
   * Subdivide all edges of an DCEL so that no edges are longer than the defined threshold.
   * @param threshold
   * @returns A subdivided {@link Dcel}.
   */
  splitEdges(input: Dcel, threshold = this.style?.epsilon) {
    if (!threshold) return;
    input.getBoundedFaces().forEach((f) => {
      const edges = f.getEdges();
      if (!edges) return;
      edges.forEach((e) => {
        e.subdivideToThreshold(threshold);
      });
    });
    return input;
  }

  /**
   * Creates Configurations for all valid edges.
   */
  createConfigurations(input: Dcel) {
    input.getHalfEdges().forEach((edge) => {
      if (edge.endpoints.every((vertex) => vertex.edges.length <= 3))
        edge.configuration = new Configuration(edge);
    });
  }

  /**
   * Converts all staircase regions of a {@link Dcel} to {@link MultiPolygon}s.
   * @param input The {@link Dcel} to convert the staircase regions of.
   * @returns An array of {@link MultiPolygon}s representing the staircase regions.
   */
  staircaseRegionsToGeometry(input: Dcel) {
    return this.getStaircases(input).map((staircase): MultiPolygon => {
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
