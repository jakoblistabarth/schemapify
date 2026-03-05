import Dcel from "@/src/Dcel/Dcel";
import Snapshot from "@/src/Snapshot/Snapshot";
import SnapshotList from "@/src/Snapshot/SnapshotList";
import { LABEL } from "@/src/c-oriented-schematization/CSchematization";
import Configuration from "@/src/c-oriented-schematization/Configuration";
import Contraction from "@/src/c-oriented-schematization/Contraction";
import { ContractionType } from "@/src/c-oriented-schematization/ContractionType";
import FaceFaceBoundaryList from "@/src/c-oriented-schematization/FaceFaceBoundaryList";

export const handleSimplify = (
  dcel: Dcel,
  configurations: Map<string, Configuration>,
  contractions: Map<
    string,
    {
      [ContractionType.P]: Contraction | undefined;
      [ContractionType.N]: Contraction | undefined;
    }
  >,
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
