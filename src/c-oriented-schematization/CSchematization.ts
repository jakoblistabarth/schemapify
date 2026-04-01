import Dcel from "@/src/Dcel/Dcel";
import Schematization, {
  Callback,
  Callbacks,
} from "@/src/Schematization/Schematization";
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
  // TO-DO: is a default label needed?
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
class CSchematization extends Schematization {
  style: CStyle;

  constructor(style: CStyle = defaultStyle, callbacks: Callbacks = {}) {
    super({ style, options: { callbacks } });
    this.style = style;
  }

  doAction({
    level,
    ...rest
  }: {
    //TO-DO: Why is the typing not inferred as for preprocess?
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
    const processor = new SignificantHalfEdgeProcessor(significantVertices);
    const withSubdividedEdges = processor.run(input);
    this.doAction({
      level: "visualize",
      dcel: withSubdividedEdges,
      label: LABEL.CLASSIFY,
      forSnapshots: {
        snapshotList: this.snapshots,
        triggeredAt: start,
        additionalData: {
          significantVertices: processor.getSignificantVertexKeys(),
        },
      },
    });

    start = performance.now();
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
        additionalData: {
          halfEdgeClasses,
          significantVertices: processor.getSignificantVertexKeys(),
        },
      },
    });

    start = performance.now();
    const staircases = new StaircaseGenerator(
      significantVertices,
      halfEdgeClasses,
      this.style,
    ).run(withSubdividedEdges);
    //TO-DO: add additional data to Snapshot: staircase regions as geometry
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

    //TO-DO: add additional data to Snapshot: staircase regions as geometry
    this.doAction({
      level: "visualize",
      dcel: withStaircases,
      label: LABEL.STAIRCASEREGIONS,
      forSnapshots: { snapshotList: this.snapshots, triggeredAt: start },
    });

    return withStaircases;
  }

  /**
   * Simplify a {@link Dcel} by removing collinear vertices and applying edge moves.
   * @param input The {@link Dcel} to simplify.
   * @param maxIterations Optional maximum number of iterations for the simplify step to prevent infinite loops. If not provided, the simplify step will run until no more edge moves can be applied or the number of half-edges is less than k.
   * @returns The simplified {@link Dcel}.
   */
  simplify(input: Dcel, maxIterations?: number) {
    let start = performance.now();
    const withoutCollinearPoints = new CollinearPointProcessor().run(input);
    this.doAction({
      level: "visualize",
      dcel: withoutCollinearPoints,
      label: LABEL.SIMPLIFY,
      forSnapshots: { snapshotList: this.snapshots, triggeredAt: start },
    });

    let dcel: Dcel = withoutCollinearPoints;
    let configurations = new ConfigurationGenerator().run(dcel);
    let iteration = 0;
    do {
      iteration++;
      const edgeCountBeforeMove = dcel.halfEdges.size;
      const faceFaceBoundaryList = new FaceFaceBoundaryListGenerator().run(
        dcel,
      );
      const { dcel: newDcel, configurations: updatedConfigurations } =
        new EdgeMoveProcessor(faceFaceBoundaryList, configurations).run(dcel);
      dcel = newDcel;
      configurations = updatedConfigurations;

      start = performance.now();
      this.doAction({
        level: "visualize",
        dcel,
        label: LABEL.SIMPLIFY,
        forSnapshots: { snapshotList: this.snapshots, triggeredAt: start },
      });

      // Break if no progress was made (prevents infinite loop)
      if (dcel.halfEdges.size === edgeCountBeforeMove) {
        if (maxIterations && iteration >= maxIterations) {
          throw new Error(
            "No progress made in edge move iteration " + iteration,
          );
        }
        break;
      }
    } while (
      maxIterations
        ? iteration < maxIterations
        : dcel.halfEdges.size >= this.style.k
    );
    // TO-DO: is it possible to return here a simplification function
    // which I can then use for handling simplifying e.g. with hotkeys?
    return dcel;
  }

  /**
   * Run the schematization process on a {@link Dcel}.
   * @param input The {@link Dcel} to run the schematization process on.
   * @param maxSimplifyIterations Optional maximum number of iterations for the simplify step to prevent infinite loops. If not provided, the simplify step will run until no more edge moves can be applied or the number of half-edges is less than k.
   * @returns The schematized {@link Dcel}.
   */
  run(input: Dcel, maxSimplifyIterations?: number) {
    const preprocessed = this.preProcess(input);
    const constrained = this.constrainAngles(preprocessed);
    return this.simplify(constrained, maxSimplifyIterations);
  }

  /**
   * Sets ε, a constant threshold for the maximum edge length within a DCEL, in the config object of the DCEL.
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
    staircases: Map<number, Staircase>,
    orientations: Map<number, Orientation>,
  ) {
    return [...staircases.entries()].map(([, staircase]): MultiPolygon => {
      const region = staircase.region.exteriorRing;

      const edgeId =
        typeof staircase.edge.id === "number" && staircase.edge.id > 0
          ? staircase.edge.id
          : undefined;
      const properties = {
        uuid: edgeId !== undefined ? edgeId.toString() : undefined,
        class: edgeId !== undefined ? orientations.get(edgeId) : undefined,
        interferesWith: staircase.interferesWith
          .map((e) => (typeof e.id === "number" && e.id > 0 ? e.id : undefined))
          .join(" ,"),
      };

      return new MultiPolygon(
        [new Polygon([region])],
        properties.uuid,
        properties,
      );
    });
  }

  //TO-DO: remove this function, seems to be only used in the canvas at the moment?
  /**
   * Gets all contractions within a DCEL.
   * @param dcel The DCEL to get the contractions from.
   * @returns An array of {@link Contraction}s.
   */
  getContractions(dcel: Dcel, configurations: Map<string, Configuration>) {
    return dcel.getHalfEdges().reduce((acc: Contraction[], edge) => {
      const configuration = edge.coordKey
        ? configurations.get(edge.coordKey)
        : undefined;
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
