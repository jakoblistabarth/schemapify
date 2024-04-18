"use client";

import { useDcelStore } from "../providers/dcel-store-provider";

const Teaser = () => {
  const { source } = useDcelStore((state) => state);
  if (source) return <></>;
  return (
    <div className="direction relative z-above-map h-full flex-row items-center pr-[30%] font-display">
      <h2 className="text-3xl font-black sm:text-4xl md:text-6xl">
        Schematic maps* on demand.
      </h2>
      <p className="mt-5">
        * Maps of regions though. Sorry, no network-based transit maps here. 😐
      </p>
    </div>
  );
};

export default Teaser;
