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
    snapshotList,
  } = useAppStore();

  useHotkeys(
    ["ctrl+s"],
    () =>
      dcel &&
      snapshotList &&
      //TODO: ideally I could write something like this:
      // schematization.doEdgeMove();
      handleSimplify(dcel, snapshotList, setActiveSnapshot),
  );
  useHotkeys(["ctrl+c"], () => removeSource());
  useHotkeys(["ctrl+1"], () => setSource("AUT_adm0-s0_5.json"));
  useHotkeys(["left"], () =>
    prevSnapshot ? setActiveSnapshot(prevSnapshot.id) : undefined,
  );
  useHotkeys(["right"], () =>
    nextSnapshot ? setActiveSnapshot(nextSnapshot.id) : undefined,
  );
  return <></>;
};

export default Hotkeys;
