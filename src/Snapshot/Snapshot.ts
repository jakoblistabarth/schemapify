import { v4 as uuid } from "uuid";
import Dcel from "../Dcel/Dcel";
import Subdivision from "../geometry/Subdivision";
import { LABEL } from "../c-oriented-schematization/CSchematization";
import MultiPolygon from "../geometry/MultiPolygon";

/**
 * Holds the current state of the schematized data as an array of GeoJSON Feature Collections.
 */
class Snapshot {
  id: string;
  label: LABEL;
  triggeredAt: number;
  recordedAt: number;
  subdivision: Subdivision;
  additionalData?: Record<string, MultiPolygon[]>;

  constructor(
    subdivision: Subdivision,
    triggeredAt: number,
    recordedAt: number,
    label = LABEL.DEFAULT,
    additionalData: Record<string, MultiPolygon[]> = {},
  ) {
    this.id = uuid();
    this.subdivision = subdivision;
    this.label = label;
    this.triggeredAt = triggeredAt;
    this.recordedAt = recordedAt;
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
      recordedAt,
      additionalData,
    }: {
      label: LABEL;
      triggeredAt: number;
      recordedAt: number;
      additionalData?: Record<string, MultiPolygon[]>;
    },
  ) {
    return new this(
      dcel.toSubdivision(),
      triggeredAt,
      recordedAt,
      label,
      additionalData,
    );
  }
}

export default Snapshot;
