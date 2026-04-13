import C from "@/src/c-oriented-schematization/C";
import CSchematization from "@/src/c-oriented-schematization/CSchematization";
import { style as defaultStyle } from "@/src/c-oriented-schematization/schematization.style";
import Dcel from "@/src/Dcel/Dcel";
import Input from "@/src/Input/";
import Job from "@/src/Job/";
import Snapshot from "@/src/Snapshot/Snapshot";
import SnapshotList from "@/src/Snapshot/SnapshotList";
import { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { create } from "zustand";

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

type AppState = {
  source?: {
    name: string;
    data: FeatureCollection<Polygon | MultiPolygon>;
  };
  loadedInput?: Input;
  setSource: (name: string) => void;
  removeSource: () => void;
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

const useAppStore = create<AppState>((set, get) => ({
  dcel: undefined,
  source: undefined,
  loadedInput: undefined,
  setSource: async (name: string) => {
    const response = await fetch(`/api/data/shapes/${name}`);
    const data = await response.json();
    const input = name.includes(".subdivision")
      ? Input.fromCoordinates(name, data)
      : Input.fromGeoJSON(data);
    // Just load the data and input, don't run schematization yet
    set(() => {
      return {
        source: { name, data },
        loadedInput: input,
        dcel: undefined,
        activeSnapshot: undefined,
        snapshotList: undefined,
        cConfig: undefined,
      };
    });
  },
  removeSource: () => {
    set(() => ({
      source: undefined,
      loadedInput: undefined,
      dcel: undefined,
      activeSnapshot: undefined,
      snapshotList: undefined,
      cConfig: undefined,
    }));
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
  viewMode: "debug",
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
