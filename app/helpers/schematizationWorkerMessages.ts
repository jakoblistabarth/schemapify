import type { CConfig } from "@/src/c-oriented-schematization/CConfig";
import type { LABEL } from "@/src/c-oriented-schematization/CSchematization";
import type { SerializedSubdivision } from "@/src/geometry/Subdivision";
import type { SerializedSnapshot } from "@/src/Snapshot/Snapshot";

export type { CConfig };

/** The message sent to the schematization worker to start a run. */
export type SchematizationRequest = {
  subdivision: SerializedSubdivision;
  cConfig: CConfig;
  /**
   * Whether to keep a snapshot of every single edge move (only useful for debugging)
   * TODO: This should probably removed/handled differently in production
   */
  keepIntermediateSteps: boolean;
};

/** The messages the schematization worker sends back while and after running. */
export type SchematizationResponse =
  | { type: "progress"; label: LABEL; step: number }
  | { type: "snapshots"; snapshots: SerializedSnapshot[] }
  | { type: "done" }
  | { type: "error"; message: string };
