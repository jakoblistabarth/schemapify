import { v4 as uuid } from "uuid";
import Dcel from "../Dcel/Dcel";
import Subdivision from "../geometry/Subdivision";
import { LABEL } from "../c-oriented-schematization/CSchematization";

//TO-DO: do not use any
//eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AdditionalData = Record<string, Map<number | string, any>>;

/**
 * Holds the current state of the schematized data as an array of GeoJSON Feature Collections.
 */
class Snapshot {
  id: string;
  label: LABEL;
  triggeredAt: number;
  recordedAt: number;
  subdivision: Subdivision;
  additionalData?: AdditionalData;

  constructor(
    subdivision: Subdivision,
    triggeredAt: number,
    label = LABEL.DEFAULT,
    additionalData: AdditionalData = {},
  ) {
    this.id = uuid();
    this.subdivision = subdivision;
    this.label = label;
    this.triggeredAt = triggeredAt;
    this.recordedAt = performance.now();
    this.additionalData = additionalData;
  }

  get duration() {
    return this.recordedAt - this.triggeredAt;
  }

  static fromDcel(
    dcel: Dcel,
    {
      label,
      triggeredAt,
      additionalData,
    }: {
      label: LABEL;
      triggeredAt: number;
      additionalData?: AdditionalData;
    },
  ) {
    return new this(dcel.toSubdivision(), triggeredAt, label, additionalData);
  }
}

export default Snapshot;
