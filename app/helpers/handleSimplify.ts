import Dcel, { STEP } from "@/src/DCEL/Dcel";

export const handleSimplify = (setDcel: (dcel: Dcel) => void, dcel?: Dcel) => {
  const startTime = new Date();
  if (!dcel) return;
  const pair = dcel?.faceFaceBoundaryList?.getMinimalConfigurationPair();
  pair?.doEdgeMove();
  dcel?.snapshotList.takeSnapshot(STEP.SIMPLIFY, startTime);
  setDcel(dcel);
};
