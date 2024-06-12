"use client";

import Dcel from "@/src/Dcel/Dcel";
import { FC, useMemo, useState } from "react";
import { RxLayers, RxPause, RxResume } from "react-icons/rx";
import Button from "./Button";
import Canvas from "./Canvas";
import CSchematization from "@/src/c-oriented-schematization/CSchematization";
import Subdivision from "@/src/geometry/Subdivision";

const DcelViewer: FC = () => {
  const [isAnimating, setIsAnimating] = useState(false);

  const { output } = useMemo(() => {
    const dcel = Dcel.fromSubdivision(
      Subdivision.fromCoordinates([
        [
          [
            [
              [0, 1],
              [-1, 0],
              [0, -1],
              [1, 0],
            ],
          ],
        ],
      ]),
    );
    const schematization = new CSchematization();
    const output = schematization.run(dcel);
    return { output };
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
        <Canvas isAnimating={isAnimating} dcel={output} />
      </div>
    </div>
  );
};

export default DcelViewer;
