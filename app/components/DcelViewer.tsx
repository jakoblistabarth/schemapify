"use client";

import Dcel from "@/src/DCEL/Dcel";
import MultiPolygon from "@/src/geometry/MultiPolygon";
import { FC, useMemo, useState } from "react";
import { RxLayers, RxPause, RxResume } from "react-icons/rx";
import Button from "./Button";
import Canvas from "./Canvas";
import CSchematization from "@/src/c-oriented-schematization/CSchematization";

const DcelViewer: FC = () => {
  const [isAnimating, setIsAnimating] = useState(false);

  const { dcel } = useMemo(() => {
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
    const schematization = new CSchematization(dcel);
    schematization.schematize();
    return { dcel };
  }, []);
  return (
    <div>
      <div className="my-2 flex justify-between gap-2 p-2 shadow">
        <Button onClick={() => setIsAnimating(!isAnimating)}>
          {isAnimating ? <RxPause /> : <RxResume />}
        </Button>
        <Button>
          <RxLayers />
        </Button>
      </div>
      <div className="relative min-h-[500px] overflow-hidden rounded bg-gray-200/25">
        <Canvas isAnimating={isAnimating} dcel={dcel} />
      </div>
    </div>
  );
};

export default DcelViewer;
