import Image from "next/image";
import brand from "../../public/schemapify-mark.svg";

const Brand = () => {
  return (
    <div className="relative flex items-center">
      <Image alt="schemapify logo" src={brand} className="mr-2 w-4" />
      <h1 className="font-display text-lg">Schemapify</h1>
    </div>
  );
};

export default Brand;
