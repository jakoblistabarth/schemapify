import useAppStore from "@/app/helpers/store";
import { GeoJSON as LGeoJSON } from "leaflet";
import "leaflet/dist/leaflet.css";
import { FC, PropsWithChildren, useMemo } from "react";
import { GeoJSON, MapContainer } from "react-leaflet";
import {
  getMapLayers,
  onEachFeature,
  pointToLayer,
} from "../../helpers/mapHelpers";
import MapControl from "./MapControl";
import SetBounds from "./SetBounds";

const Map: FC<PropsWithChildren> = ({ children, ...rest }) => {
  const { source, activeSnapshot, mapMode } = useAppStore();

  const regionBounds = useMemo(() => {
    return new LGeoJSON(source?.data).getBounds();
  }, [source]);

  const layers = activeSnapshot
    ? getMapLayers(activeSnapshot?.layers, mapMode)
    : [];
  return (
    <MapContainer
      zoom={0}
      style={{ height: "100%" }}
      zoomControl={false}
      doubleClickZoom={false}
      dragging={source ? true : false}
      keyboard={false}
      key={source?.name ?? ""}
      {...rest}
    >
      {activeSnapshot?.layers &&
        layers.map(([layerName, layer]) => (
          <GeoJSON
            key={`${layerName}-${activeSnapshot.id}`}
            data={layer}
            onEachFeature={onEachFeature}
            pointToLayer={pointToLayer}
          />
        ))}
      {/* TODO: Trigger only if source changes (and not also on activeSnapshot change) */}
      {source && <SetBounds bounds={regionBounds} />}
      <MapControl />
    </MapContainer>
  );
};

export default Map;
