import dynamic from "next/dynamic";
import Brand from "./components/Brand";
import Configurator from "./components/Configurator";
import Footer from "./components/Footer";
import Hotkeys from "./components/Hotkeys";
import SnapshotNavigator from "./components/SnapshotNavigator";
import Teaser from "./components/Teaser";
import getGroupedTestFiles from "./helpers/getGroupedTestFiles";

const DynamicMap = dynamic(() => import("./components/Map/Map"), {
  ssr: false,
});

const Home = async () => {
  const files = await getGroupedTestFiles();

  return (
    <>
      <Hotkeys />
      <div className="relative grid h-screen grid-cols-1 grid-rows-1">
        <main className="relative">
          <div id="map" className="absolute inset-0">
            <DynamicMap />
          </div>
          <div className="grid h-full grid-cols-[2fr_5fr] grid-rows-[auto_6fr_auto] grid-areas-[header_header,sidebar_main,bottom-nav_bottom-nav]">
            <div className="mt-5 self-start justify-self-center grid-in-[header]">
              <Brand />
            </div>
            <div className="self-start justify-self-start grid-in-[sidebar]">
              <Configurator files={files} />
            </div>
            <div className="self-center grid-in-[main]">
              <Teaser />
            </div>
            <div className="self-end justify-self-center grid-in-[bottom-nav]">
              <SnapshotNavigator />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Home;
