import "leaflet/dist/leaflet.css";
import { FC, PropsWithChildren } from "react";
import { MapContainer } from "react-leaflet";

const Map: FC<PropsWithChildren> = ({ children, ...rest }) => {
  return (
    <MapContainer
      zoom={0}
      style={{ height: "100%" }}
      zoomControl={false}
      doubleClickZoom={false}
      {...rest}
    >
      {children}
    </MapContainer>
  );
};

export default Map;
