import Footer from "../components/Footer";
import Brand from "../components/Brand";
import Link from "next/link";
import { RiArrowLeftLine } from "react-icons/ri";
import Button from "../components/Button";

const Home = () => {
  return (
    <div className="mx-auto max-w-lg py-10">
      <header>
        <Brand />
      </header>
      <main className="relative">
        <div>
          <h2 className="text-xl">About this tool</h2>
          <p>
            Schemapify is a web based cartographic schematization tool, written
            in Typescript. It aims to support the schematization of geo data
            (Shapefile, GeoJSON) in an interactive and accessible way. It uses
            the
            <em>
              Area-Preserving Simplification and Schematization of Polygonal
              Subdivisions (Buchin, K., Meulemans, W., Van Renssen, A., &
              Speckmann, B. (2016). Area-Preserving Simplification and
              Schematization of Polygonal Subdivisions. ACM Transactions on
              Spatial Algorithms and Systems , 2(1), 1-36. [2].{" "}
              <a href="https://doi.org/10.1145/2818373">
                https://doi.org/10.1145/2818373
              </a>
              .)
            </em>
          </p>
          <Link href={"/"}>
            <Button primary>
              <RiArrowLeftLine /> Back
            </Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Home;
