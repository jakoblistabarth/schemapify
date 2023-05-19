import useAppStore from "@/app/helpers/store";
import "leaflet/dist/leaflet.css";
import { FC, PropsWithChildren } from "react";
import { MapContainer } from "react-leaflet";

const Map: FC<PropsWithChildren> = ({ children, ...rest }) => {
  const { source } = useAppStore();
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
      {children}
    </MapContainer>
  );
};

export default Map;
