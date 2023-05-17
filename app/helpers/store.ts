import { create } from "zustand";
import { FeatureCollection, Polygon, MultiPolygon } from "geojson";
import Dcel, { STEP, Snapshot } from "@/src/DCEL/Dcel";

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
  activeSnapshot: STEP;
  setActiveSnapshot: (step: STEP) => void;
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
      return { source: { name, data }, dcel };
    });
  },
  removeSource: () => {
    set(() => ({ source: undefined, dcel: undefined }));
  },
  mapMode: "dcel",
  toggleMapMode: () =>
    set((state) => ({ mapMode: state.mapMode == "dcel" ? "polygon" : "dcel" })),
  activeSnapshot: STEP.LOAD,
  setActiveSnapshot: (step: STEP) => set(() => ({ activeSnapshot: step })),
}));

export default useAppStore;
