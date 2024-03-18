import Image from "next/image";
import brand from "../../public/schemapify-mark.svg";

const Brand = () => {
  return (
    <div className="relative z-above-map flex items-center">
      <Image alt="schemapify logo" src={brand} className="mr-2 w-6" />
      <h1 className="font-display text-3xl">Schemapify</h1>
    </div>
  );
};

export default Brand;
