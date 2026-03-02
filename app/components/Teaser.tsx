"use client";

import useAppStore from "../helpers/store";

const Teaser = () => {
  const { source } = useAppStore();
  if (source) return <></>;
  return (
    <div className="direction font-display relative h-full flex-row items-center pr-[30%]">
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
