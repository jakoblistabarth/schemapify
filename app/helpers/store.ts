import CSchematization from "@/src/c-oriented-schematization/CSchematization";
import Dcel from "@/src/Dcel/Dcel";
import Input from "@/src/Input/";
import Job from "@/src/Job/";
import Snapshot from "@/src/Snapshot/Snapshot";
import SnapshotList from "@/src/Snapshot/SnapshotList";
import { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { create } from "zustand";

export type MapMode = "dcel" | "polygon";
export type ViewMode = "debug" | "simple";

type AppState = {
  source?: {
    name: string;
    data: FeatureCollection<Polygon | MultiPolygon>;
  };
  setSource: (name: string) => void;
  removeSource: () => void;
  dcel?: Dcel;
  mapMode: MapMode;
  toggleMapMode: () => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
  activeSnapshot?: Snapshot;
  nextSnapshot?: Snapshot;
  prevSnapshot?: Snapshot;
  setActiveSnapshot: (id: string) => void;
  snapshotList?: SnapshotList;
};

const useAppStore = create<AppState>((set) => ({
  dcel: undefined,
  source: undefined,
  setSource: async (name: string) => {
    const response = await fetch(`/api/data/shapes/${name}`);
    const data = await response.json();
    const input = name.includes(".subdivision")
      ? Input.fromCoordinates(name, data)
      : Input.fromGeoJSON(data);
    const schematization = new CSchematization(undefined, {
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
    });
    const job = new Job(input, schematization);
    const dcel = job.run();
    const snapshotList = job.snapshots;
    const activeSnapshot = snapshotList.snapshots[0];
    const [, nextSnapshot] = job.snapshots.getPrevNext(activeSnapshot.id);
    set(() => {
      return {
        source: { name, data },
        dcel,
        activeSnapshot,
        nextSnapshot,
        snapshotList,
      };
    });
  },
  removeSource: () => {
    set(() => ({
      source: undefined,
      dcel: undefined,
      activeSnapshot: undefined,
      snapshotList: undefined,
    }));
  },
  mapMode: "dcel",
  toggleMapMode: () =>
    set((state) => ({ mapMode: state.mapMode == "dcel" ? "polygon" : "dcel" })),
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
