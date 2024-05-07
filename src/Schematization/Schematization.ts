import Dcel from "@/src/Dcel/Dcel";

export type Callback = (args: { dcel: Dcel; label: string }) => void;
export type LogLevel = "debug" | "visualize";
export type Callbacks = { [key in TypeLogLevel]?: TypeCallback };

/**
 * Abstract class for a schematization process.
 * A schematization process is a process that takes a {@link Dcel} as input and returns a schematized {@link Dcel} as output.
 */
abstract class Schematization {
  // TODO: Make these properties private, again?
  // Does not seem to be possible with abstract classes
  callbacks: Callbacks;
  style: object;

  constructor({
    style,
    options,
  }: {
    style: object;
    options: { callbacks: Callbacks };
  }) {
    this.callbacks = options.callbacks;
    this.style = style;
  }

  //TODO: Add docstring
  doAction({
    level,
    ...rest
  }: {
    label: string;
    dcel: Dcel;
    level: "debug" | "visualize";
  }) {
    this.callbacks[level]?.(rest);
  }

  abstract preProcess(input: Dcel): Dcel;

  abstract run(input: Dcel): Dcel;
}

export default Schematization;
