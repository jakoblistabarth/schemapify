"use client";

import CSchematization from "@/src/c-oriented-schematization/CSchematization";
import Dcel from "@/src/Dcel/Dcel";
import { FC, useMemo, useState } from "react";
import Canvas from "./Canvas";

const DcelViewer: FC = () => {
  const [isAnimating, setIsAnimating] = useState(false);

  const { output } = useMemo(() => {
    const dcel = Dcel.fromCoordinates([
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
    ]);
    const schematization = new CSchematization();
    const output = schematization.run(dcel);
    return { output };
  }, []);
  return (
    <div className="relative min-h-[500px] overflow-hidden rounded bg-gray-200/25">
      <Canvas
        isAnimating={isAnimating}
        dcel={output}
        onAnimatingChange={setIsAnimating}
      />
    </div>
  );
};

export default DcelViewer;
