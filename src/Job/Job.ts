import Input from "@/src/Input/";
import Schematization from "@/src/Schematization/Schematization";
import SnapshotList from "@/src/Snapshot/SnapshotList";

/**
 * Represents a job.
 * A job is a schematization process that can be executed.
 */
class Job {
  #input: Input;
  #schematization: Schematization;
  snapshots: SnapshotList;

  constructor(input: Input, schematization: Schematization) {
    this.#input = input;
    this.#schematization = schematization;
    this.snapshots = new SnapshotList();
  }

  /**
   * Run the schematization process.
   * @returns A {@link Dcel} representing the schematized input data.
   */
  run() {
    return this.#schematization.run(this.#input.getDcel());
  }
}

export default Job;
