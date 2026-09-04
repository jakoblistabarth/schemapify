"use client";

import useAppStore from "../helpers/store";

const Teaser = () => {
  const { source } = useAppStore();
  if (source) return <></>;
  return (
    <div className="direction font-display relative h-full max-w-2xl flex-row items-center">
      <h2 className="text-3xl font-black font-stretch-ultra-condensed sm:text-4xl md:text-6xl">
        Schematic maps<span className="text-blue-500">*</span> on&nbsp;demand.
      </h2>
      <p className="mt-10 text-xl">Shave down vertices for smoother maps.</p>
      <p className="font-sans text-sm">
        <span className="text-blue-500">*</span> Polygons only.
      </p>
    </div>
  );
};

export default Teaser;
