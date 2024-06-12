import Dcel from "@/src/Dcel/Dcel";
import Schematization, {
  Callback,
  Callbacks,
} from "@/src/Schematization/Schematization";
import SnapshotList from "@/src/Snapshot/SnapshotList";
import MultiPolygon from "@/src/geometry/MultiPolygon";
import Polygon from "@/src/geometry/Polygon";
import HalfEdgeClassGenerator, { Orientation } from "./HalfEdgeClassGenerator";
import PreProcessor from "./PreProcessor";
import SignificantHalfEdgeProcessor from "./SignificantHalfEdgeProcessor";
import StaircaseGenerator from "./StaircaseGenerator";
import StaircaseProcessor from "./StaircaseProcessor";
import VertexClassGenerator from "./VertexClassGenerator";
import type { CStyle } from "./schematization.style";
import { style as defaultStyle } from "./schematization.style";
import Contraction from "./Contraction";
import { ContractionType } from "./ContractionType";
import Staircase from "./Staircase";
import CollinearPointProcessor from "./CollinearPointProcessor";
import FaceFaceBoundaryListGenerator from "./FaceFaceBoundaryListGenerator";
import ConfigurationGenerator from "./ConfigurationGenerator";
import Configuration from "./Configuration";
import EdgeMoveProcessor from "./EdgeMoveProcessor";

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
   * Preprocesses a {@link Dcel} by subdividing all edges.
   * @param input The {@link Dcel} to preprocess.
   * @returns The preprocessed {@link Dcel}.
   */
  preProcess(input: Dcel) {
    const dcel = input.clone();
    const t0 = performance.now();
    this.doAction({
      level: "visualize",
      dcel: dcel,
      label: LABEL.LOAD,
      forSnapshots: { snapshotList: this.snapshots, triggeredAt: t0 },
    });

    const t1 = performance.now();
    const preProcessor = new PreProcessor(this.style.epsilon ?? Infinity);
    const output = preProcessor.run(dcel);
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
      this.style,
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

    start = performance.now();
    const withStaircases = new StaircaseProcessor(staircases).run(
      withSubdividedEdges,
    );

    //TODO: add additional data to Snapshot: staircaseRegions as geometry
    this.doAction({
      level: "visualize",
      dcel: withStaircases,
      label: LABEL.STAIRCASEREGIONS,
      forSnapshots: { snapshotList: this.snapshots, triggeredAt: start },
    });

    return withStaircases;
  }

  /**
   * Simplify a {@link Dcel} by removing superfluous vertices and applying edge moves.
   * @param input The {@link Dcel} to simplify.
   * @returns The simplified {@link Dcel}.
   */
  simplify(input: Dcel, debug = false) {
    let start = performance.now();
    const withoutCollinearPoints = new CollinearPointProcessor().run(input);
    this.doAction({
      level: "visualize",
      dcel: withoutCollinearPoints,
      label: LABEL.SIMPLIFY,
      forSnapshots: { snapshotList: this.snapshots, triggeredAt: start },
    });

    start = performance.now();
    const faceFaceBoundaryList = new FaceFaceBoundaryListGenerator().run(input);
    const configurations = new ConfigurationGenerator().run(input);
    this.doAction({
      level: "visualize",
      dcel: input,
      label: LABEL.SIMPLIFY,
      forSnapshots: { snapshotList: this.snapshots, triggeredAt: start },
    });

    // TODO: check wether loop is correct
    let dcel;
    do {
      dcel = new EdgeMoveProcessor(faceFaceBoundaryList, configurations).run(
        input,
      );
    } while (debug ? !debug : dcel.halfEdges.size >= this.style.k);

    this.doAction({
      level: "visualize",
      dcel,
      label: LABEL.SIMPLIFY,
      forSnapshots: { snapshotList: this.snapshots, triggeredAt: start },
    });
    // TODO: is it possible to return here a simplification function
    // which I can then use for handling simplifying e.g. with hotkeys?
    return dcel;
  }

  /**
   * Run the schematization process on a {@link Dcel}.
   * @param input The {@link Dcel} to run the schematization process on.
   * @returns The schematized {@link Dcel}.
   */
  run(input: Dcel) {
    const preprocessed = this.preProcess(input);
    const constrained = this.constrainAngles(preprocessed);
    return this.simplify(constrained);
  }

  /**
   * Sets ε, a constant threshold for the maximum edge length within a DCEL, in the DCEL's config object.
   * @param lambda A constant factor.
   * @returns Epsilon. The maximum length of a {@link HalfEdge}.
   */
  setEpsilon(input: Dcel, lambda: number) {
    return (this.style.epsilon = input.getDiameter() * lambda);
  }

  /**
   * Converts all staircase regions of a {@link Dcel} to {@link MultiPolygon}s.
   * @param input The {@link Dcel} to convert the staircase regions of.
   * @returns An array of {@link MultiPolygon}s representing the staircase regions.
   */
  staircaseRegionsToGeometry(
    staircases: Map<string, Staircase>,
    orientations: Map<string, Orientation>,
  ) {
    return [...staircases.entries()].map(([, staircase]): MultiPolygon => {
      const region = staircase.region.exteriorRing;

      const properties = {
        uuid: staircase.edge.uuid,
        class: orientations.get(staircase.edge.uuid),
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

  //TODO: remove this function, seems to be only used in the canvas at the moment?
  /**
   * Gets all contractions within a DCEL.
   * @param dcel The DCEL to get the contractions from.
   * @returns An array of {@link Contraction}s.
   */
  getContractions(dcel: Dcel, configurations: Map<string, Configuration>) {
    return dcel.getHalfEdges().reduce((acc: Contraction[], edge) => {
      const configuration = configurations.get(edge.uuid);
      if (!configuration) return acc;
      const n = configuration[ContractionType.N];
      const p = configuration[ContractionType.P];
      if (n) acc.push(n);
      if (p) acc.push(p);
      return acc;
    }, []);
  }
}

export default CSchematization;
