import Dcel from "@/src/DCEL/Dcel";
import Snapshot from "@/src/Snapshot/Snapshot";
import SnapshotList from "@/src/Snapshot/SnapshotList";
import { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { createStore } from "zustand";

export type MapMode = "dcel" | "polygon";

export type DcelStoreState = {
  source?: {
    name: string;
    data: FeatureCollection<Polygon | MultiPolygon>;
  };
  dcel?: Dcel;
  mapMode: MapMode;
  activeSnapshot?: Snapshot;
  nextSnapshot?: Snapshot;
  prevSnapshot?: Snapshot;
};

export type DcelStoreActions = {
  setDcel: (dcel: Dcel) => void;
  setSource: (name: string) => void;
  removeSource: () => void;
  toggleMapMode: () => void;
  setActiveSnapshot: (id: string, snapshotList: SnapshotList) => void;
};

export type DcelStore = DcelStoreState & DcelStoreActions;

const defaultInitState: DcelStoreState = {
  mapMode: "dcel",
};

const createDcelStore = (initState: DcelStoreState = defaultInitState) =>
  createStore<DcelStore>()((set) => ({
    ...initState,
    setDcel: (dcel: Dcel) => set({ dcel }),
    setSource: async (name: string) => {
      const response = await fetch(`/api/data/shapes/${name}`);
      const data = await response.json();
      const dcel = Dcel.fromGeoJSON(data);
      dcel.schematize();
      const activeSnapshot = dcel.snapshotList.snapshots[0];
      const [, nextSnapshot] = dcel.snapshotList.getPrevNext(activeSnapshot.id);
      set(() => {
        return {
          source: { name, data },
          dcel,
          activeSnapshot,
          nextSnapshot,
        };
      });
    },
    removeSource: () => {
      set(() => ({
        source: undefined,
        dcel: undefined,
        activeSnapshot: undefined,
      }));
    },
    toggleMapMode: () =>
      set((state) => ({
        mapMode: state.mapMode == "dcel" ? "polygon" : "dcel",
      })),
    setActiveSnapshot: (id, snapshotList) => {
      const [prevSnapshot, nextSnapshot] = snapshotList.getPrevNext(id);
      set((state) => ({
        activeSnapshot: state.dcel?.snapshotList.getSnapshot(id),
        nextSnapshot,
        prevSnapshot,
      }));
    },
  }));

export default createDcelStore;
