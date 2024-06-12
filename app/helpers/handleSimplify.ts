import Dcel from "@/src/Dcel/Dcel";
import Snapshot from "@/src/Snapshot/Snapshot";
import SnapshotList from "@/src/Snapshot/SnapshotList";
import { LABEL } from "@/src/c-oriented-schematization/CSchematization";
import FaceFaceBoundaryList from "@/src/c-oriented-schematization/FaceFaceBoundaryList";

export const handleSimplify = (
  dcel: Dcel,
  faceFaceBoundaryList: FaceFaceBoundaryList,
  snapshotList: SnapshotList,
  setActiveSnapshot: (id: string) => void,
) => {
  const timeStart = performance.now();
  const pair =
    faceFaceBoundaryList?.getMinimalConfigurationPair(configurations);
  pair?.doEdgeMove(dcel, contractions, configurations);
  const snapshot = Snapshot.fromDcel(dcel, {
    label: LABEL.SIMPLIFY,
    triggeredAt: timeStart,
  });
  snapshotList?.snapshots.push(snapshot);
  setActiveSnapshot(snapshot.id);
};
