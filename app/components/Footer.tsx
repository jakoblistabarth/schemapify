import Link from "next/link";
import { RiGithubLine } from "react-icons/ri";

const Footer = () => {
  return (
    <>
      <footer
        className="bg-white p-3"
        // gridarea footer
      >
        <div className="grid grid-cols-2">
          <div>
            <Link href={"/about"}>About this tool</Link>
          </div>
          <div className="flex justify-end">
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
