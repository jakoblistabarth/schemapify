"use client";

import { FC } from "react";
import Canvas from "../Canvas";
import useAppStore from "@/app/helpers/store";

const Map: FC = () => {
  const { activeSnapshot } = useAppStore();
  const dcel = activeSnapshot?.subdivision.toDcel();
  return dcel ? <Canvas isAnimating={false} dcel={dcel} /> : null;
};

export default Map;
