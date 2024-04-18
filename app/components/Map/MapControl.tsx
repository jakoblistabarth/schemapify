import { useDcelStore } from "@/app/providers/dcel-store-provider";
import clsx from "clsx";
import {
  RiAddLine,
  RiBug2Line,
  RiFlag2Line,
  RiMagicLine,
  RiStackLine,
  RiSubtractLine,
} from "react-icons/ri";
import { useMap } from "react-leaflet";
import Button from "../Button";

const MapControl = () => {
  const map = useMap();
  const { toggleMapMode, mapMode, source } = useDcelStore((state) => state);
  return (
    <div
      className={clsx(
        "relative z-above-map float-right mr-3 mt-10 flex flex-col items-center",
        !source && "pointer-events-none opacity-30",
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
