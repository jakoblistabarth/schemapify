import { create } from "zustand";
import { FeatureCollection, Polygon, MultiPolygon } from "geojson";
import Dcel, { Snapshot } from "@/src/DCEL/Dcel";

export type MapMode = "dcel" | "polygon";

type AppState = {
  source?: {
    name: string;
    data: FeatureCollection<Polygon | MultiPolygon>;
  };
  setSource: (name: string) => void;
  removeSource: () => void;
  dcel?: Dcel;
  setDcel: (dcel: Dcel) => void;
  mapMode: MapMode;
  toggleMapMode: () => void;
  activeSnapshot?: Snapshot;
  setActiveSnapshot: (id: string) => void;
};

const useAppStore = create<AppState>((set) => ({
  dcel: undefined,
  setDcel: (dcel: Dcel) => set(() => ({ dcel })),
  source: undefined,
  setSource: async (name: string) => {
    const response = await fetch(`/api/data/shapes/${name}`);
    const data = await response.json();
    const dcel = Dcel.fromGeoJSON(data);
    dcel.schematize();
    set(() => {
      return {
        source: { name, data },
        dcel,
        activeSnapshot: dcel.snapShots[0],
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
  mapMode: "dcel",
  toggleMapMode: () =>
    set((state) => ({ mapMode: state.mapMode == "dcel" ? "polygon" : "dcel" })),
  activeSnapshot: undefined,
  setActiveSnapshot: (id: string) =>
    set((state) => ({
      activeSnapshot: state.dcel?.snapShots.find((d) => d.id === id),
    })),
}));

export default useAppStore;
