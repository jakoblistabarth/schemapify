import * as geoJson from "geojson";
import SnapshotList from "./SnapshotList";
import { v4 as uuid } from "uuid";
import { STEP } from "../DCEL/Dcel";

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
  snapshotList: SnapshotList;
  createdAt: Date;
  duration: number;
  layers: SnapshotLayers;

  constructor(
    snapshotList: SnapshotList,
    layers: SnapshotLayers,
    step: STEP,
    startTime?: Date
  ) {
    this.id = uuid();
    this.step = step;
    this.snapshotList = snapshotList;
    this.createdAt = new Date();
    this.layers = layers;
    this.duration = this.getDuration(startTime);
  }

  getDuration(startTime?: Date) {
    const now = Number(new Date());
    if (startTime) return now - Number(startTime);
    const mostRecentSnapshot = this.snapshotList.getMostRecentSnapshot();
    if (mostRecentSnapshot) return now - Number(mostRecentSnapshot.createdAt);
    return now - Number(this.snapshotList.createdAt);
  }
}

export default Snapshot;
