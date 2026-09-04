import Image from "next/image";
import brand from "../../public/mark.svg";

const Brand = () => {
  return (
    <div className="relative flex items-center">
      <Image alt="Mapshaver Logo" src={brand} className="mr-2 w-4" />
      <h1 className="font-display text-lg">Mapshaver</h1>
    </div>
  );
};

export default Brand;
