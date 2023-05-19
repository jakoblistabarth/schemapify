const Teaser = () => {
  return (
    <div className="direction relative z-above-map h-full flex-row items-center pr-[30%] font-display">
      <h2 className="text-3xl font-black sm:text-4xl md:text-6xl">
        Create schematic maps* the{" "}
        <span className="line-through">automated</span> <span>chilled</span>{" "}
        way.
      </h2>
      <p>* maps of regions, sorry no network-based transit maps 😐</p>
    </div>
  );
};

export default Teaser;
