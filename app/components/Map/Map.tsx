"use client";

import useAppStore, { selectSubdivision } from "@/app/helpers/store";
import { FC, useMemo, useState } from "react";
import Canvas from "../Canvas";

const Map: FC = () => {
  const [isAnimating, setIsAnimating] = useState(false);
  const viewMode = useAppStore((state) => state.viewMode);
  const subdivision = useAppStore(selectSubdivision);
  // Only build DCEL when in debug view mode
  const dcel = useMemo(
    () => (viewMode === "debug" ? subdivision?.toDcel() : undefined),
    [subdivision, viewMode],
  );
  return subdivision ? (
    <Canvas
      isAnimating={isAnimating}
      subdivision={subdivision}
      dcel={dcel}
      onAnimatingChange={setIsAnimating}
    />
  ) : null;
};

export default Map;
