"use client";

import {
  FC,
  PropsWithChildren,
  createContext,
  useContext,
  useRef,
} from "react";
import { StoreApi, useStore } from "zustand";
import createDcelStore, { type DcelStore } from "../helpers/store";

export const DcelStoreContext = createContext<StoreApi<DcelStore> | null>(null);

export const DcelStoreProvider: FC<PropsWithChildren> = ({ children }) => {
  const storeRef = useRef<StoreApi<DcelStore>>();
  if (!storeRef.current) {
    storeRef.current = createDcelStore();
  }

  return (
    <DcelStoreContext.Provider value={storeRef.current}>
      {children}
    </DcelStoreContext.Provider>
  );
};

export const useDcelStore = <T,>(selector: (store: DcelStore) => T) => {
  const store = useContext(DcelStoreContext);
  if (!store) {
    throw new Error("useDcelStore must be used within a DcelStoreProvider");
  }
  return useStore(store, selector);
};
