"use client";

import { FC } from "react";
import Canvas from "../Canvas";
import useAppStore from "@/app/helpers/store";

const Map: FC = () => {
  const { dcel } = useAppStore();
  return (
    <div className="h-full bg-gray-50">
      {dcel && <Canvas isAnimating={false} dcel={dcel} />}
    </div>
  );
};

export default Map;
