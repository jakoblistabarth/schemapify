import { LABEL } from "@/src/c-oriented-schematization/CSchematization";
import Input from "@/src/Input/";
import { Crs } from "@/src/Input/Crs";
import Snapshot from "@/src/Snapshot/Snapshot";
import SnapshotList from "@/src/Snapshot/SnapshotList";
import { create } from "zustand";
import { parseGeoFile } from "./parseGeoFile";
import type {
  CConfig,
  SchematizationRequest,
  SchematizationResponse,
} from "./schematizationWorkerMessages";

export type ViewMode = "debug" | "simple";
export type { CConfig };

/** The progress of a schematization run, as last reported by the worker. */
export type SchematizationProgress = { label: LABEL; step: number };

export type Source = {
  name: string;
  /** The CRS the data is defined in, where the source format declares one. */
  crs?: Crs;
  /** Vertex count, excluding the repeated closing point of each ring. */
  vertexCount: number;
  /** Number of features dropped because they are not areal. */
  skipped: number;
};

type AppState = {
  source?: Source;
  loadedInput?: Input;
  setSource: (name: string) => void;
  setSourceFromFile: (file: File) => Promise<void>;
  removeSource: () => void;
  sourceError?: string;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
  activeSnapshot?: Snapshot;
  nextSnapshot?: Snapshot;
  prevSnapshot?: Snapshot;
  setActiveSnapshot: (id: string) => void;
  snapshotList?: SnapshotList;
  cConfig?: CConfig;
  /** Whether a schematization is currently running in the worker. */
  isSchematizing: boolean;
  schematizationProgress?: SchematizationProgress;
  schematizationError?: string;
  runSchematization: (config: CConfig) => void;
  cancelSchematization: () => void;
};

/**
 * The worker of the currently running schematization, kept outside of the store:
 * it is a handle to terminate, not state to render.
 */
let worker: Worker | undefined;

/** Stop the running schematization, if there is one. */
const terminateWorker = () => {
  worker?.terminate();
  worker = undefined;
};

/**
 * The state to reset to whenever the source changes, so that a stale
 * schematization can never outlive the data it was computed from.
 */
const clearedState = {
  source: undefined,
  sourceError: undefined,
  loadedInput: undefined,
  activeSnapshot: undefined,
  nextSnapshot: undefined,
  prevSnapshot: undefined,
  snapshotList: undefined,
  cConfig: undefined,
  isSchematizing: false,
  schematizationProgress: undefined,
  schematizationError: undefined,
} satisfies Partial<AppState>;

/**
 * Derive the loaded state from an {@link Input}.
 * @param input the freshly loaded input
 * @param counts diagnostics from the parser, recomputed when not supplied
 */
const loaded = (
  input: Input,
  counts?: { vertexCount: number; skipped: number },
) => ({
  source: {
    name: input.name,
    crs: input.crs,
    vertexCount: counts?.vertexCount ?? input.data.vertexCount,
    skipped: counts?.skipped ?? 0,
  },
  loadedInput: input,
});

/**
 * The geometry currently on display: the active snapshot's, or — as long as no
 * schematization has run — the loaded input's. Deliberately a
 * {@link Subdivision}, so that displaying data never requires building a
 * {@link Dcel}.
 */
export const selectSubdivision = (state: AppState) =>
  state.activeSnapshot?.subdivision ?? state.loadedInput?.data;

const useAppStore = create<AppState>((set, get) => ({
  source: undefined,
  loadedInput: undefined,
  setSource: async (name: string) => {
    terminateWorker();
    const response = await fetch(`/api/data/shapes/${name}`);
    const data = await response.json();
    const input = name.includes(".subdivision")
      ? Input.fromCoordinates(name, data)
      : Input.fromGeoJSON(data, name);
    // Just load the data and input, don't run schematization yet
    set(() => ({ ...clearedState, ...loaded(input) }));
  },
  setSourceFromFile: async (file: File) => {
    terminateWorker();
    const result = await parseGeoFile(file);
    if (!result.ok) {
      set(() => ({ ...clearedState, sourceError: result.error }));
      return;
    }
    const { input, vertexCount, skipped } = result;
    set(() => ({
      ...clearedState,
      ...loaded(input, { vertexCount, skipped }),
    }));
  },
  removeSource: () => {
    terminateWorker();
    set(() => ({ ...clearedState }));
  },
  cConfig: undefined,
  isSchematizing: false,
  runSchematization: (config) => {
    const { loadedInput, viewMode } = get();
    if (!loadedInput) return;
    terminateWorker();

    worker = new Worker(new URL("./schematization.worker.ts", import.meta.url));
    const request: SchematizationRequest = {
      subdivision: loadedInput.data.toSerialized(),
      cConfig: config,
      // Every edge move is only worth recording when the steps are actually inspected.
      keepIntermediateSteps: viewMode === "debug",
    };

    worker.onmessage = ({ data }: MessageEvent<SchematizationResponse>) => {
      if (data.type === "progress")
        return set(() => ({
          schematizationProgress: { label: data.label, step: data.step },
        }));
      if (data.type === "snapshots")
        return set((state) => {
          const snapshotList = new SnapshotList([
            ...(state.snapshotList?.snapshots ?? []),
            ...data.snapshots.map(Snapshot.fromSerialized),
          ]);
          const activeSnapshot =
            state.activeSnapshot ?? snapshotList.snapshots[0];
          const [prevSnapshot, nextSnapshot] = snapshotList.getPrevNext(
            activeSnapshot.id,
          );
          return { snapshotList, activeSnapshot, prevSnapshot, nextSnapshot };
        });
      if (data.type === "error") {
        terminateWorker();
        return set(() => ({
          isSchematizing: false,
          schematizationError: data.message,
        }));
      }
      terminateWorker();
      set(() => ({ isSchematizing: false }));
    };

    worker.onerror = ({ message }) => {
      terminateWorker();
      set(() => ({ isSchematizing: false, schematizationError: message }));
    };

    set(() => ({
      cConfig: config,
      isSchematizing: true,
      schematizationError: undefined,
      schematizationProgress: undefined,
      snapshotList: new SnapshotList(),
      activeSnapshot: undefined,
      prevSnapshot: undefined,
      nextSnapshot: undefined,
    }));
    worker.postMessage(request);
  },
  cancelSchematization: () => {
    terminateWorker();
    set(() => ({ isSchematizing: false }));
  },
  viewMode: "simple",
  setViewMode: (mode: ViewMode) => set(() => ({ viewMode: mode })),
  toggleViewMode: () =>
    set((state) => ({
      viewMode: state.viewMode === "debug" ? "simple" : "debug",
    })),
  activeSnapshot: undefined,
  setActiveSnapshot: (id) => {
    set((state) => {
      const [prevSnapshot, nextSnapshot] =
        state.snapshotList?.getPrevNext(id) ?? [];

      return {
        activeSnapshot: state.snapshotList?.getSnapshot(id),
        nextSnapshot,
        prevSnapshot,
      };
    });
  },
}));

export default useAppStore;
