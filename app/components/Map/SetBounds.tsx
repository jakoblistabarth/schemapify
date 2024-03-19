import { LatLngBounds } from "leaflet";
import { FC } from "react";
import { useMap } from "react-leaflet";

type Props = {
  bounds: LatLngBounds;
};

const SetBounds: FC<Props> = ({ bounds }) => {
  const map = useMap();
  map.fitBounds(bounds);
  return <></>;
};

export default SetBounds;
