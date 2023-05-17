import { SnapshotLayers } from "@/src/DCEL/Dcel";
import { Feature, FeatureCollection } from "geojson";
import { PathOptions, Path, CircleMarker, LatLng } from "leaflet";
import { MapMode } from "./store";

const baseStyle = (feature: Feature): PathOptions => ({
  fillOpacity: 0.2,
  weight: 3,
  dashArray: feature.properties?.interferesWith ? "6" : undefined,
});

export const onEachFeature = (feature: Feature, layer: Path) => {
  layer.setStyle(baseStyle(feature)),
    layer.bindTooltip(
      feature.properties
        ? `<div>${Object.entries(feature.properties)
            .map(([k, v]) => `<div>${k}: ${v}</div>`)
            .join("")}</div>`
        : "no properties",
      { sticky: true, opacity: 1 }
    );
  layer.on({
    mouseover: (e) => {
      e.target.setStyle({ weight: 6, fillOpacity: 0.5 });
    },
    mouseout: (e) => {
      e.target.setStyle(baseStyle(feature));
    },
  });
};

export const pointToLayer = (feature: Feature, latlng: LatLng) => {
  const isSignificant = !!feature.properties?.significant;
  return new CircleMarker(latlng, {
    radius: isSignificant ? 6 : 3,
    opacity: isSignificant ? 0.8 : undefined,
    fillOpacity: isSignificant ? 0.8 : undefined,
  });
};

export const getMapLayers = (
  layers: SnapshotLayers,
  mapMode: MapMode
): [string, FeatureCollection][] => {
  if (mapMode === "polygon") return [["polygons", layers.features]];

  const sortOrder = ["faces", "staircaseRegions", "edges", "vertices"];
  const ordering = new Map(sortOrder.map((d, i) => [d, i]));

  return Object.entries(layers)
    .filter(([k]) => k !== "features")
    .sort(([a], [b]) => (ordering.get(a) ?? 0) - (ordering.get(b) ?? 0));
};
