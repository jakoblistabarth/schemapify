"use client";

import useAppStore from "@/app/helpers/store";
import { FC, useState } from "react";
import Canvas from "../Canvas";

const Map: FC = () => {
  const [isAnimating, setIsAnimating] = useState(false);
  const { activeSnapshot, loadedInput } = useAppStore();
  const dcel = activeSnapshot?.subdivision.toDcel() ?? loadedInput?.getDcel();
  return dcel ? (
    <Canvas
      isAnimating={isAnimating}
      dcel={dcel}
      onAnimatingChange={setIsAnimating}
    />
  ) : null;
};

export default Map;
