import Input from "@/src/Input/";
import Schematization from "@/src/Schematization/Schematization";

/**
 * Represents a job.
 * A job is a schematization process that can be executed.
 */
class Job {
  #input: Input;
  #schematization: Schematization;

  constructor(input: Input, schematization: Schematization) {
    this.#input = input;
    this.#schematization = schematization;
  }

  /**
   * Run the schematization process.
   * @returns A {@link Dcel} representing the schematized input data.
   */
  run() {
    return this.#schematization.run(this.#input.getDcel());
  }

  get snapshots() {
    return this.#schematization.snapshots;
  }
}

export default Job;
