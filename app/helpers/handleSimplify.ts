import Dcel from "@/src/Dcel/Dcel";
import Snapshot from "@/src/Snapshot/Snapshot";
import SnapshotList from "@/src/Snapshot/SnapshotList";
import { LABEL } from "@/src/c-oriented-schematization/CSchematization";

export const handleSimplify = (
  dcel: Dcel,
  snapshotList: SnapshotList,
  setActiveSnapshot: (id: string) => void,
) => {
  if (!dcel) return;
  const timeStart = performance.now();
  const pair = dcel?.faceFaceBoundaryList?.getMinimalConfigurationPair();
  pair?.doEdgeMove();
  const snapshot = Snapshot.fromDcel(dcel, {
    label: LABEL.SIMPLIFY,
    triggeredAt: timeStart,
  });
  snapshotList?.snapshots.push(snapshot);
  setActiveSnapshot(snapshot.id);
};
