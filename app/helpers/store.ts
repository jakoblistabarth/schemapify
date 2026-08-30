import C from "@/src/c-oriented-schematization/C";
import CSchematization from "@/src/c-oriented-schematization/CSchematization";
import { style as defaultStyle } from "@/src/c-oriented-schematization/schematization.style";
import Dcel from "@/src/Dcel/Dcel";
import Input from "@/src/Input/";
import { Crs } from "@/src/Input/Crs";
import Job from "@/src/Job/";
import Snapshot from "@/src/Snapshot/Snapshot";
import SnapshotList from "@/src/Snapshot/SnapshotList";
import { create } from "zustand";
import { parseGeoFile } from "./parseGeoFile";

export type ViewMode = "debug" | "simple";
export type CConfig =
  | {
      type: "regular";
      orientations: number;
      beta: number;
    }
  | {
      type: "irregular";
      angles: number[];
    };

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
  dcel?: Dcel;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
  activeSnapshot?: Snapshot;
  nextSnapshot?: Snapshot;
  prevSnapshot?: Snapshot;
  setActiveSnapshot: (id: string) => void;
  snapshotList?: SnapshotList;
  cConfig?: CConfig;
  setCConfig: (config: CConfig) => void;
  runSchematization: (c: C) => void;
};

/**
 * The state to reset to whenever the source changes, so that a stale
 * schematization can never outlive the data it was computed from.
 */
const clearedState = {
  source: undefined,
  sourceError: undefined,
  loadedInput: undefined,
  dcel: undefined,
  activeSnapshot: undefined,
  nextSnapshot: undefined,
  prevSnapshot: undefined,
  snapshotList: undefined,
  cConfig: undefined,
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

const useAppStore = create<AppState>((set, get) => ({
  dcel: undefined,
  source: undefined,
  loadedInput: undefined,
  setSource: async (name: string) => {
    const response = await fetch(`/api/data/shapes/${name}`);
    const data = await response.json();
    const input = name.includes(".subdivision")
      ? Input.fromCoordinates(name, data)
      : Input.fromGeoJSON(data, name);
    // Just load the data and input, don't run schematization yet
    set(() => ({ ...clearedState, ...loaded(input) }));
  },
  setSourceFromFile: async (file: File) => {
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
    set(() => ({ ...clearedState }));
  },
  cConfig: undefined,
  setCConfig: (config) => {
    set(() => ({ cConfig: config }));
  },
  runSchematization: (c) => {
    const { loadedInput } = get();
    if (!loadedInput) return;

    const schematization = new CSchematization(
      { ...defaultStyle, c },
      {
        visualize: (args) => {
          args.forSnapshots?.snapshotList.add(
            new Snapshot(
              args.dcel.toSubdivision(),
              args.forSnapshots.triggeredAt,
              args.label,
              args.forSnapshots?.additionalData,
            ),
          );
        },
      },
    );
    const job = new Job(loadedInput, schematization);
    const dcel = job.run();
    const snapshotList = job.snapshots;
    const activeSnapshot = snapshotList.snapshots[0];
    const [, nextSnapshot] = job.snapshots.getPrevNext(activeSnapshot.id);
    set(() => {
      return {
        dcel,
        activeSnapshot,
        nextSnapshot,
        snapshotList,
      };
    });
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
