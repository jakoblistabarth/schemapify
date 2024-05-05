import * as geoJson from "geojson";
import { v4 as uuid } from "uuid";
import Dcel from "../Dcel/Dcel";
import CSchematization, {
  STEP,
} from "../c-oriented-schematization/CSchematization";
import { Config } from "../c-oriented-schematization/schematization.config";

export type SnapshotLayers = {
  vertices: geoJson.FeatureCollection<geoJson.Point>;
  edges: geoJson.FeatureCollection<geoJson.LineString>;
  faces: geoJson.FeatureCollection<geoJson.Polygon>;
  features: geoJson.FeatureCollection<geoJson.Polygon | geoJson.MultiPolygon>;
  staircaseRegions?: geoJson.FeatureCollection<geoJson.Polygon>;
};

/**
 * Holds the current state of the schematized data as an array of GeoJSON Feature Collections.
 */
class Snapshot {
  id: string;
  step: STEP;
  createdAt: Date;
  duration: number;
  layers: SnapshotLayers;

  constructor(layers: SnapshotLayers, step: STEP, duration: number) {
    this.id = uuid();
    this.step = step;
    this.createdAt = new Date();
    this.layers = layers;
    this.duration = duration;
  }

  getDuration() {
    return this.duration;
  }

  static fromDcel(
    dcel: Dcel,
    {
      step,
      duration,
      config,
      staircaseRegions,
    }: {
      step: STEP;
      duration: number;
      config: Config;
      staircaseRegions?: ReturnType<
        CSchematization["staircaseRegionsToGeoJSON"]
      >;
    },
  ) {
    return new this(
      {
        vertices: dcel.verticesToGeoJSON(),
        edges: dcel.edgesToGeoJSON(config.c.getSectors()),
        faces: dcel.facesToGeoJSON(),
        features: dcel.toGeoJSON(),
        staircaseRegions:
          step === STEP.STAIRCASEREGIONS && staircaseRegions
            ? staircaseRegions
            : undefined,
      },
      step,
      duration,
    );
  }
}

export default Snapshot;
