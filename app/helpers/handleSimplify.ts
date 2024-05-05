import Dcel from "@/src/Dcel/Dcel";
import Snapshot from "@/src/Snapshot/Snapshot";
import SnapshotList from "@/src/Snapshot/SnapshotList";
import { STEP } from "@/src/c-oriented-schematization/CSchematization";
import { config } from "@/src/c-oriented-schematization/schematization.config";

export const handleSimplify = (
  dcel: Dcel,
  snapshotList: SnapshotList,
  setActiveSnapshot: (id: string) => void,
) => {
  if (!dcel) return;
  const pair = dcel?.faceFaceBoundaryList?.getMinimalConfigurationPair();
  pair?.doEdgeMove();
  const snapshot = Snapshot.fromDcel(dcel, {
    step: STEP.SIMPLIFY,
    duration: 0,
    config,
  });
  snapshotList?.snapshots.push(snapshot);
  setActiveSnapshot(snapshot.id);
};
