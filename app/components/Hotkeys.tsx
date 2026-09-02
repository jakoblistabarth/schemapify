"use client";

import { useHotkeys } from "react-hotkeys-hook";
// import { handleSimplify } from "../helpers/handleSimplify";
import useAppStore from "../helpers/store";

const Hotkeys = () => {
  const {
    removeSource,
    setActiveSnapshot,
    prevSnapshot,
    nextSnapshot,
    snapshotList,
    toggleViewMode,
  } = useAppStore();

  useHotkeys(
    ["ctrl+s"],
    () =>
      snapshotList &&
      //TO-DO: reimplement step by step simplification
      // ideally I could write something like this:
      // schematization.doEdgeMove();
      // handleSimplify(dcel, snapshotList, setActiveSnapshot),
      console.log("Simplifying..."),
  );
  useHotkeys(["ctrl+c"], () => removeSource());
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
