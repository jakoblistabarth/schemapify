import Dcel from "@/src/Dcel/Dcel";
import SnapshotList from "../Snapshot/SnapshotList";
import { LABEL } from "../c-oriented-schematization/CSchematization";
import { AdditionalData } from "../Snapshot/Snapshot";

export type Callback = (args: {
  dcel: Dcel;
  label: LABEL;
  forSnapshots?: {
    snapshotList: SnapshotList;
    triggeredAt: number;
    additionalData?: AdditionalData;
  };
}) => void;
export type LogLevel = "debug" | "visualize";
export type Callbacks = { [key in LogLevel]?: Callback };

/**
 * Abstract class for a schematization process.
 * A schematization process is a process that takes a {@link Dcel} as input and returns a schematized {@link Dcel} as output.
 */
abstract class Schematization {
  // TO-DO: Make these properties private, again?
  // Does not seem to be possible with abstract classes
  callbacks: Callbacks;
  style: object;
  snapshots: SnapshotList;

  constructor({
    style,
    options,
  }: {
    style: object;
    options: { callbacks: Callbacks };
  }) {
    this.snapshots = new SnapshotList();
    this.callbacks = options.callbacks;
    this.style = style;
  }

  //TO-DO: Improve JsDoc string
  /**
   * Perform an action based on the defined callbacks.
   * @param args An object containing the arguments for the action.
   */
  abstract doAction({
    level,
    ...rest
  }: {
    level: "debug" | "visualize";
  } & Parameters<Callback>[0]): void;

  abstract preProcess(input: Dcel): Dcel;

  abstract run(input: Dcel): Dcel;
}

export default Schematization;
