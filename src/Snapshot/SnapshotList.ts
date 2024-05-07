import { LABEL } from "../c-oriented-schematization/CSchematization";
import Snapshot from "./Snapshot";

/**
 * A list of snapshots (records at certain points in time during the schematization)
 * associated with a certain {@link Dcel}.
 */
class SnapshotList {
  snapshots: Snapshot[];

  constructor(snapshots?: Snapshot[]) {
    this.snapshots = snapshots ?? [];
  }

  getMostRecentSnapshot(): Snapshot | undefined {
    return this.snapshots.at(-1);
  }

  getTotalDuration(): number | undefined {
    if (this.hasSnapshots())
      return this.snapshots.reduce((acc, d) => acc + d.duration, 0);
  }

  getSnapshot(id: string) {
    return this.snapshots.find((d) => d.id === id);
  }

  getSnapshotIndex(id: string) {
    return this.snapshots.map((d) => d.id).indexOf(id);
  }

  getPrevNext(id: string) {
    const activeSnapshotIndex = this.getSnapshotIndex(id);

    const [prevId, nextId] = Array(2)
      .fill(activeSnapshotIndex)
      .map((d, i) => (i === 0 ? d - 1 : d + 1))
      .map((d) =>
        d != undefined && d >= 0 && d < this.snapshots.length
          ? this.snapshots[d]
          : undefined,
      );
    return [prevId, nextId];
  }

  hasSnapshots() {
    return this.snapshots.length > 0;
  }

  getSnapshotByStep() {
    const mapByStep = this.snapshots.reduce<Map<LABEL, Snapshot[]>>(
      (acc, d) => {
        const snapshots = acc.get(d.label) ?? [];
        return acc.set(d.label, [...snapshots, d]);
      },
      new Map<LABEL, Snapshot[]>(),
    );

    return Array.from(mapByStep.entries());
  }

  /**
   * Add a snapshot to the list
   * @param snapshot The snapshot to add to the list
   */
  add(snapshot: Snapshot) {
    this.snapshots.push(snapshot);
  }
}

export default SnapshotList;
