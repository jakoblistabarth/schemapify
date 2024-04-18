"use client";

import Dcel from "@/src/DCEL/Dcel";
import MultiPolygon from "@/src/geometry/MultiPolygon";
import { FC, useMemo, useState } from "react";
import { RxLayers, RxPause, RxResume } from "react-icons/rx";
import Button from "./Button";
import Canvas from "./Canvas";
import { useDcelStore } from "../providers/dcel-store-provider";
import SnapshotNavigator from "./SnapshotNavigator";

const DcelViewer: FC = () => {
  const [isAnimating, setIsAnimating] = useState(false);
  const { setDcel, dcel } = useDcelStore((state) => state);

  useMemo(() => {
    const dcel = Dcel.fromMultiPolygons([
      MultiPolygon.fromCoordinates([
        [
          [
            [0, 1],
            [-1, 0],
            [0, -1],
            [1, 0],
          ],
        ],
      ]),
    ]);
    dcel.schematize();
    setDcel(dcel);
  }, [setDcel]);
  return (
    <div className="grid grid-cols-1 grid-rows-[auto_5fr_auto] gap-y-4">
      <div className="relative col-start-2 col-end-1 row-span-full min-h-[500px] overflow-hidden rounded bg-gray-200/25">
        {dcel && <Canvas isAnimating={isAnimating} />}
      </div>
      <div className="z-above-map col-span-full row-start-1 mx-4 mt-4 flex gap-2 self-end justify-self-end rounded-md bg-white p-2">
        <Button className="p-2" onClick={() => setIsAnimating(!isAnimating)}>
          {isAnimating ? <RxPause /> : <RxResume />}
        </Button>
        <Button className="p-2">
          <RxLayers />
        </Button>
      </div>
      <div className="col-span-full row-start-3 mb-4 self-end justify-self-center">
        <SnapshotNavigator />
      </div>
    </div>
  );
};

export default DcelViewer;
