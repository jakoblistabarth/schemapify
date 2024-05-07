//TODO: Add subdivision class for MultiPolygon[]

class Subdivision {
  static fromDcel(dcel: Dcel): Subdivision {
    return dcel.toSubdivision();
  }

  static fromCoordinates(coordinates: [number, number][][][]): Subdivision {
    return new this();
  }

  toDcel(): Dcel {
    return new Dcel();
  }
}

class Dcel {
  toSubdivision(): Subdivision {
    return new Subdivision();
  }
}

class Input {
  fileName: string;
  data: null;
  fileFormat: "shp" | "json" | "kml";

  constructor(
    fileName: string,
    data: null,
    fileFormat: "shp" | "json" | "kml",
  ) {
    this.fileName = fileName;
    this.data = data;
    this.fileFormat = fileFormat;
  }

  static from(filePath: string): Input {
    // do something
    return new this(filePath, null, "json");
  }

  getDcel(): Dcel {
    return new Dcel();
  }
}

class Snapshot {
  id: string;
  label: string;
  triggeredAt: Date;
  recordedAt?: Date;
  subdivision: Subdivision;

  constructor(subdivision: Subdivision, label = "default") {
    this.id = "";
    this.subdivision = subdivision;
    this.label = label;
    this.triggeredAt = new Date();
  }
}

// see: https://github.dev/mbloch/mapshaper/tree/master/src/mapshaper-job.mjs
class Job {
  #input: Input;
  #schematization: Schematization;
  snapshots: Snapshot[] = [];

  constructor(input: Input, schematization: Schematization) {
    this.#input = input;
    this.#schematization = schematization;
  }

  run() {
    this.#schematization.run(this.#input);
  }
}

type TypeCallback = (args: { dcel: Dcel; label: string }) => void;
type TypeLogLevel = "debug" | "visualize";
type TypeCallbacks = { [key in TypeLogLevel]?: TypeCallback };

abstract class Schematization {
  #callbacks: TypeCallbacks;
  #style: object;

  constructor({
    style,
    options,
  }: {
    style: object;
    options: { callbacks: TypeCallbacks };
  }) {
    this.#callbacks = options.callbacks;
    this.#style = style;
  }

  doAction({
    level,
    ...rest
  }: {
    label: string;
    dcel: Dcel;
    level: "debug" | "visualize";
  }) {
    this.#callbacks[level]?.(rest);
  }

  abstract preProcess(input: Input): Dcel;

  abstract run(input: Input): Dcel;
}

class CSchematization extends Schematization {
  run(input: Input) {
    const output = this.preProcess(input);
    return output;
  }

  preProcess(input: Input) {
    const dcel = input.getDcel();
    // …
    this.doAction({ label: "loaded", dcel, level: "debug" });
    this.doAction({ label: "simplified", dcel, level: "visualize" });
    return dcel;
  }
}

class GridSchematization extends Schematization {
  run(input: Input) {
    const output = this.preProcess(input);
    return output;
  }

  preProcess(input: Input) {
    const dcel = input.getDcel();
    this.doAction({
      label: "loaded",
      dcel,
      level: "debug",
    });
    this.doAction({
      label: "simplified",
      dcel,
      level: "visualize",
    });
    return dcel;
  }
}

const job = new Job(
  Input.from("path/to/file"),
  new CSchematization({ style: {}, options: { callbacks: {} } }),
);
job.run();

const snapshots = [];
const hexilinearSimple = new CSchematization({
  style: {
    epsilon: 1,
    steps: 10,
    c: [Math.PI, Math.PI / 2, Math.PI / 4],
  },
  options: {
    callbacks: {
      debug: (args) =>
        snapshots.push(new Snapshot(args.dcel.toSubdivision(), args.label)),
    },
  },
});
const africa = hexilinearSimple.run(Input.from("path/to/africa/data"));
const europe = hexilinearSimple.run(Input.from("path/to/europe/data"));
