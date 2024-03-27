import Link from "next/link";
import { RiGithubLine } from "react-icons/ri";

const Footer = () => {
  return (
    <>
      <footer
        className="bg-white p-3"
        // gridarea footer
      >
        <div className="flex gap-5">
          <Link href={"/about"}>About</Link>
          <Link href={"/implementation/configuration"}>Algorithm</Link>
          <div className="flex flex-grow justify-end">
            <Link
              className="flex items-center"
              href={"https://github.com/jakoblistabarth/schemapify"}
            >
              <div className="mr-1">
                <RiGithubLine />
              </div>
              Github
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
