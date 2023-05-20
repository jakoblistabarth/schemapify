import Dcel, { STEP } from "@/src/DCEL/Dcel";
import SnapshotList from "@/src/Snapshot/SnapshotList";

export const handleSimplify = (
  setActiveSnapshot: (id: string, snapshotList: SnapshotList) => void,
  dcel?: Dcel
) => {
  const startTime = new Date();
  if (!dcel) return;
  const pair = dcel?.faceFaceBoundaryList?.getMinimalConfigurationPair();
  pair?.doEdgeMove();
  const newSnapshot = dcel.snapshotList.takeSnapshot(STEP.SIMPLIFY, startTime);
  setActiveSnapshot(newSnapshot.id, dcel.snapshotList);
};
