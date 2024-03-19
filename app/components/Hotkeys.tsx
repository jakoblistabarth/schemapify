"use client";

import { useHotkeys } from "react-hotkeys-hook";
import { handleSimplify } from "../helpers/handleSimplify";
import useAppStore from "../helpers/store";

const Hotkeys = () => {
  const {
    dcel,
    removeSource,
    setSource,
    setActiveSnapshot,
    prevSnapshot,
    nextSnapshot,
  } = useAppStore();

  useHotkeys(["ctrl+alt+s"], () => handleSimplify(setActiveSnapshot, dcel));
  useHotkeys(["ctrl+c"], () => removeSource());
  useHotkeys(["ctrl+1"], () => setSource("AUT_adm0-s0_5.json"));
  useHotkeys(["left"], () =>
    prevSnapshot && dcel?.snapshotList
      ? setActiveSnapshot(prevSnapshot.id, dcel?.snapshotList)
      : undefined,
  );
  useHotkeys(["right"], () =>
    nextSnapshot && dcel?.snapshotList
      ? setActiveSnapshot(nextSnapshot.id, dcel?.snapshotList)
      : undefined,
  );
  return <></>;
};

export default Hotkeys;
