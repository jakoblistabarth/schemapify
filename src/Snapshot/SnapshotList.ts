import Dcel, { STEP } from "../DCEL/Dcel";
import Snapshot from "./Snapshot";

/**
 * A list of snapshots (records at certain points in time during the schematization)
 * associated with a certain {@link Dcel}.
 */
class SnapshotList {
  dcel: Dcel;
  createdAt: Date;
  snapshots: Snapshot[];

  constructor(dcel: Dcel) {
    this.dcel = dcel;
    this.createdAt = new Date();
    this.snapshots = [];
  }

  takeSnapshot(step: STEP, startTime?: Date): Snapshot {
    const snapshot = new Snapshot(
      this,
      {
        vertices: this.dcel.verticesToGeoJSON(),
        edges: this.dcel.edgesToGeoJSON(),
        faces: this.dcel.facesToGeoJSON(),
        features: this.dcel.toGeoJSON(),
      },
      step,
      startTime
    );
    if (step === STEP.STAIRCASEREGIONS)
      snapshot.layers.staircaseRegions = this.dcel.staircaseRegionsToGeoJSON();
    this.snapshots.push(snapshot);
    return snapshot;
  }

  getMostRecentSnapshot(): Snapshot | undefined {
    const length = this.snapshots.length;
    if (length < 1) return undefined;
    return this.snapshots[length - 1];
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
          : undefined
      );
    return [prevId, nextId];
  }

  hasSnapshots() {
    return this.snapshots.length > 0;
  }

  getSnapshotByStep() {
    const mapByStep = this.snapshots.reduce<Map<STEP, Snapshot[]>>((acc, d) => {
      const snapShots = acc.get(d.step) ?? [];
      return acc.set(d.step, [...snapShots, d]);
    }, new Map<STEP, Snapshot[]>());

    return Array.from(mapByStep.entries());
  }
}

export default SnapshotList;
