import { useMap } from "react-leaflet";
import Button from "../Button";
import {
  RiFlag2Line,
  RiAddLine,
  RiSubtractLine,
  RiStackLine,
  RiBug2Line,
  RiMagicLine,
} from "react-icons/ri";
import useAppStore from "@/app/helpers/store";
import clsx from "clsx";

const MapControl = () => {
  const map = useMap();
  const { toggleMapMode, mapMode, source } = useAppStore();
  return (
    <div
      className={clsx(
        "relative z-above-map float-right mr-3 mt-10 flex flex-col items-center",
        !source && "pointer-events-none opacity-30"
      )}
    >
      <div className="flex flex-col">
        <Button className="p-3" onClick={() => map.zoomIn()} disabled>
          <RiFlag2Line size={15} />
        </Button>
        <hr />
        <Button className="p-3" onClick={() => map.zoomIn()}>
          <RiAddLine size={15} />
        </Button>
        <Button className="p-3" onClick={() => map.zoomOut()}>
          <RiSubtractLine size={15} />
        </Button>
      </div>
      <Button className="mt-1 p-3" onClick={() => map.zoomIn()} disabled>
        <RiStackLine size={15} />
      </Button>
      <Button className="mt-1 p-3" onClick={() => toggleMapMode()}>
        {mapMode == "polygon" ? (
          <RiBug2Line size={15} />
        ) : (
          <RiMagicLine size={15} />
        )}
      </Button>
    </div>
  );
};

export default MapControl;
