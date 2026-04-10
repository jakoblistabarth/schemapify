"use client";

import { useHotkeys } from "react-hotkeys-hook";
// import { handleSimplify } from "../helpers/handleSimplify";
import useAppStore from "../helpers/store";

const Hotkeys = () => {
  const {
    dcel,
    removeSource,
    setSource,
    setActiveSnapshot,
    prevSnapshot,
    nextSnapshot,
    snapshotList,
    toggleViewMode,
  } = useAppStore();

  useHotkeys(
    ["ctrl+s"],
    () =>
      dcel &&
      snapshotList &&
      //TO-DO: reimplement step by step simplification
      // ideally I could write something like this:
      // schematization.doEdgeMove();
      // handleSimplify(dcel, snapshotList, setActiveSnapshot),
      console.log("Simplifying..."),
  );
  useHotkeys(["ctrl+c"], () => removeSource());
  useHotkeys(["ctrl+1"], () => setSource("diamond.json"));
  useHotkeys(["ctrl+2"], () => setSource("unaligned-deviating-2.json"));
  useHotkeys(["ctrl+3"], () => setSource("triangle.json"));
  useHotkeys(["left"], () =>
    prevSnapshot ? setActiveSnapshot(prevSnapshot.id) : undefined,
  );
  useHotkeys(["right"], () =>
    nextSnapshot ? setActiveSnapshot(nextSnapshot.id) : undefined,
  );
  useHotkeys(["w"], () => toggleViewMode());
  return <></>;
};

export default Hotkeys;
