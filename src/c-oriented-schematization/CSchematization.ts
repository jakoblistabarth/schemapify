import Dcel from "@/src/Dcel/Dcel";
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
import type { CStyle } from "./schematization.style";
import { style as defaultStyle } from "./schematization.style";
import PreProcessor from "./PreProcessor";
import VertexClassGenerator from "./VertexClassGenerator";
import SignificantHalfEdgeProcessor from "./SignificantHalfEdgeProcessor";
import HalfEdgeClassGenerator from "./HalfEdgeClassGenerator";
import StaircaseGenerator from "./StaircaseGenerator";
import StaircaseProcessor from "./StaircaseProcessor";

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
    input = input.clone();
    const t0 = performance.now();
    this.doAction({
      level: "visualize",
      dcel: input,
      label: LABEL.LOAD,
      forSnapshots: { snapshotList: this.snapshots, triggeredAt: t0 },
    });

    const t1 = performance.now();
    const preProcessor = new PreProcessor(this.style.epsilon);
    const output = preProcessor.run(input);
    this.doAction({
      level: "visualize",
      dcel: output,
      label: LABEL.SUBDIVIDE,
      forSnapshots: { snapshotList: this.snapshots, triggeredAt: t1 },
    });
    return output;
  }

  /**
   * Constrain the angles of a {@link Dcel}.
   * @param input The {@link Dcel} to constrain the angles of.
   * @returns The constrained {@link Dcel}.
   */
  constrainAngles(input: Dcel) {
    let start = performance.now();

    const significantVertices = new VertexClassGenerator(
      this.style.c.sectors,
    ).run(input);
    const withSubdividedEdges = new SignificantHalfEdgeProcessor(
      significantVertices,
    ).run(input);
    //TODO: add vertex classes map to snapshot
    this.doAction({
      level: "visualize",
      dcel: withSubdividedEdges,
      label: LABEL.CLASSIFY,
      forSnapshots: {
        snapshotList: this.snapshots,
        triggeredAt: start,
      },
    });

    start = performance.now();
    //TODO: add halfedge classes to snapshot
    const halfEdgeClasses = new HalfEdgeClassGenerator(
      this.style.c,
      significantVertices,
    ).run(withSubdividedEdges);
    this.doAction({
      level: "visualize",
      dcel: withSubdividedEdges,
      label: LABEL.CLASSIFY,
      forSnapshots: {
        snapshotList: this.snapshots,
        triggeredAt: start,
      },
    });

    start = performance.now();
    const staircases = new StaircaseGenerator(
      significantVertices,
      halfEdgeClasses,
    ).run(withSubdividedEdges);
    //TODO: add additional data to Snapshot: staircaseRegions as geometry
    this.doAction({
      level: "visualize",
      dcel: withSubdividedEdges,
      label: LABEL.STAIRCASEREGIONS,
      forSnapshots: {
        snapshotList: this.snapshots,
        triggeredAt: start,
      },
    });

    const withStaircases = new StaircaseProcessor(staircases).run(
      withSubdividedEdges,
    );

    this.calculateStaircases(input);
    //TODO: add additional data to Snapshot: staircaseRegions as geometry
    //   additionalData: { staircaseRegions: this.staircaseRegionsToGeometry() },
    this.doAction({
      level: "visualize",
      dcel: input,
      label: LABEL.STAIRCASEREGIONS,
      forSnapshots: { snapshotList: this.snapshots, triggeredAt: start },
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
    const preprocessed = this.preProcess(input);
    const constrained = this.constrainAngles(preprocessed);
    const output = this.simplify(constrained);
    return output;
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
