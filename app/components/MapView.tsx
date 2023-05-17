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
  const { source, dcel, activeSnapshot, mapMode } = useAppStore();

  const regionBounds = useMemo(() => {
    return new LGeoJSON(source?.data).getBounds();
  }, [source]);

  const layers = dcel?.snapShots
    ? //@ts-expect-error
      getMapLayers(dcel.snapShots[activeSnapshot].layers, mapMode)
    : [];

  return (
    <div id="map" className="absolute inset-0">
      <Map>
        {activeSnapshot &&
          dcel?.snapShots[activeSnapshot]?.layers &&
          layers.map(([layerName, layer]) => (
            <GeoJSON
              key={`${layerName}-${dcel.snapShots[activeSnapshot]?.time}`}
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
