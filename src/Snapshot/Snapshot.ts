import { v4 as uuid } from "uuid";
import { LABEL } from "../c-oriented-schematization/CSchematization";
import type { Orientation } from "../c-oriented-schematization/HalfEdgeClassGenerator";
import Dcel from "../Dcel/Dcel";
import Polygon, { type PolygonCoordinates } from "../geometry/Polygon";
import Subdivision, {
  type SerializedSubdivision,
} from "../geometry/Subdivision";

/**
 * Debug information recorded alongside a {@link Snapshot}.
 * Kept free of DCEL references, so that a snapshot stays serializable.
 */
export type AdditionalData = {
  /** Whether a vertex, keyed by its coordinate key, is significant. */
  significantVertices?: Map<string, boolean>;
  /** The classification of a half-edge, keyed by its coordinate key. */
  halfEdgeClasses?: Map<
    string,
    { orientation: Orientation; assignedDirection: number }
  >;
  /** The region of a staircase, keyed by the id of the half-edge it replaces. */
  regions?: Map<number, Polygon>;
};

/** {@link AdditionalData} reduced to plain data. */
export type SerializedAdditionalData = Omit<AdditionalData, "regions"> & {
  regions?: Map<number, PolygonCoordinates>;
};

/**
 * A snapshot reduced to plain data, so that it survives structured cloning
 * (which drops class prototypes) and can be posted from a worker.
 */
export type SerializedSnapshot = {
  id: string;
  label: LABEL;
  triggeredAt: number;
  recordedAt: number;
  subdivision: SerializedSubdivision;
  additionalData?: SerializedAdditionalData;
};

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

  /**
   * Reduce the snapshot to plain data.
   * @returns The snapshot as structured-cloneable data.
   */
  toSerialized(): SerializedSnapshot {
    const { regions, ...rest } = this.additionalData ?? {};
    return {
      id: this.id,
      label: this.label,
      triggeredAt: this.triggeredAt,
      recordedAt: this.recordedAt,
      subdivision: this.subdivision.toSerialized(),
      additionalData: {
        ...rest,
        ...(regions && {
          regions: new Map(
            Array.from(regions, ([id, region]) => [id, region.toCoordinates()]),
          ),
        }),
      },
    };
  }

  /**
   * Rebuild a snapshot from its serialized form.
   * Identity and timings are restored, so that the snapshot's {@link Snapshot#duration} stays meaningful.
   * @param serialized The output of {@link Snapshot#toSerialized}.
   * @returns The restored snapshot.
   */
  static fromSerialized(serialized: SerializedSnapshot) {
    const { regions, ...rest } = serialized.additionalData ?? {};
    const snapshot = new Snapshot(
      Subdivision.fromSerialized(serialized.subdivision),
      serialized.triggeredAt,
      serialized.label,
      {
        ...rest,
        ...(regions && {
          regions: new Map(
            Array.from(regions, ([id, coordinates]) => [
              id,
              Polygon.fromCoordinates(coordinates),
            ]),
          ),
        }),
      },
    );
    snapshot.id = serialized.id;
    snapshot.recordedAt = serialized.recordedAt;
    return snapshot;
  }
}

export default Snapshot;
