import Dcel from "@/src/Dcel/Dcel";
import Schematization, {
  Callback,
  Callbacks,
} from "@/src/Schematization/Schematization";
import CollinearPointProcessor from "./CollinearPointProcessor";
import ConfigurationGenerator from "./ConfigurationGenerator";
import EdgeMoveProcessor from "./EdgeMoveProcessor";
import FaceFaceBoundaryListGenerator from "./FaceFaceBoundaryListGenerator";
import HalfEdgeClassGenerator from "./HalfEdgeClassGenerator";
import PreProcessor from "./PreProcessor";
import type { CStyle } from "./schematization.style";
import { style as defaultStyle } from "./schematization.style";
import SignificantHalfEdgeProcessor from "./SignificantHalfEdgeProcessor";
import StaircaseGenerator from "./StaircaseGenerator";
import StaircaseProcessor from "./StaircaseProcessor";
import VertexClassGenerator from "./VertexClassGenerator";

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
    this.doAction({
      level: "visualize",
      dcel: withSubdividedEdges,
      label: LABEL.STAIRCASEREGIONS,
      forSnapshots: {
        snapshotList: this.snapshots,
        triggeredAt: start,
        additionalData: {
          regions: staircases,
        },
      },
    });

    start = performance.now();
    const withStaircases = new StaircaseProcessor(staircases).run(
      withSubdividedEdges,
    );

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
    while (
      maxIterations !== undefined
        ? iteration < maxIterations
        : dcel.halfEdges.size >= this.style.k
    ) {
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
        if (
          maxIterations !== undefined &&
          maxIterations !== 0 &&
          iteration >= maxIterations
        ) {
          throw new Error(
            "No progress made in edge move iteration " + iteration,
          );
        }
        break;
      }
    }
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
}

export default CSchematization;
