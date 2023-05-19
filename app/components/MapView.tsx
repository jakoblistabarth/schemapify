import Map from "./Map/Map";
import useAppStore from "../helpers/store";
import { GeoJSON } from "react-leaflet";
import SetBounds from "./Map/SetBounds";
import {
  getMapLayers,
  onEachFeature,
  pointToLayer,
} from "../helpers/mapHelpers";
import { useMemo } from "react";
import { GeoJSON as LGeoJSON } from "leaflet";
import MapControl from "./Map/MapControl";

const MapView = () => {
  const { source, activeSnapshot, mapMode } = useAppStore();

  const regionBounds = useMemo(() => {
    return new LGeoJSON(source?.data).getBounds();
  }, [source]);

  const layers = activeSnapshot
    ? getMapLayers(activeSnapshot?.layers, mapMode)
    : [];

  return (
    <div id="map" className="absolute inset-0">
      <Map>
        {activeSnapshot?.layers &&
          layers.map(([layerName, layer]) => (
            <GeoJSON
              key={`${layerName}-${activeSnapshot.time}`}
              data={layer}
              onEachFeature={onEachFeature}
              pointToLayer={pointToLayer}
            />
          ))}
        {/* TODO: Trigger only if source changes (and not also on activeSnapshot change) */}
        {source && <SetBounds bounds={regionBounds} />}
        <MapControl />
      </Map>
    </div>
  );
};

export default MapView;
