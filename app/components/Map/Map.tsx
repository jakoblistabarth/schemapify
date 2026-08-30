"use client";

import useAppStore from "@/app/helpers/store";
import { FC, useMemo, useState } from "react";
import Canvas from "../Canvas";

const Map: FC = () => {
  const [isAnimating, setIsAnimating] = useState(false);
  const { activeSnapshot, loadedInput } = useAppStore();
  // Building the Dcel is expensive, so it must not repeat on every render.
  const dcel = useMemo(
    () => activeSnapshot?.subdivision.toDcel() ?? loadedInput?.getDcel(),
    [activeSnapshot, loadedInput],
  );
  return dcel ? (
    <Canvas
      isAnimating={isAnimating}
      dcel={dcel}
      onAnimatingChange={setIsAnimating}
    />
  ) : null;
};

export default Map;
