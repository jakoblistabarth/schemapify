import Dcel, { STEP } from "@/src/DCEL/Dcel";

export const handleSimplify = (
  setActiveSnapshot: (id: string) => void,
  dcel?: Dcel
) => {
  const startTime = new Date();
  if (!dcel) return;
  const pair = dcel?.faceFaceBoundaryList?.getMinimalConfigurationPair();
  pair?.doEdgeMove();
  const newSnapshot = dcel.snapshotList.takeSnapshot(STEP.SIMPLIFY, startTime);
  setActiveSnapshot(newSnapshot.id);
};
