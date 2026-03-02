import Brand from "./components/Brand";
import Configurator from "./components/Configurator";
import DynamicMap from "./components/DynamicMap";
import Footer from "./components/Footer";
import Hotkeys from "./components/Hotkeys";
import SnapshotNavigator from "./components/SnapshotNavigator";
import Teaser from "./components/Teaser";
import getGroupedTestFiles from "./helpers/getGroupedTestFiles";

const Home = async () => {
  const files = await getGroupedTestFiles();

  return (
    <>
      <Hotkeys />
      <div className="grid h-screen grid-rows-[1fr_auto]">
        <main className="relative bg-gray-50">
          <DynamicMap />

          <div className="grid h-full grid-cols-[2fr_5fr] grid-rows-[auto_6fr_auto] [grid-template-areas:'header_header'_'sidebar_main'_'bottom-nav_bottom-nav']">
            <div className="mt-5 self-start justify-self-center [grid-area:header]">
              <Brand />
            </div>
            <div className="self-start justify-self-start [grid-area:sidebar]">
              <Configurator files={files} />
            </div>
            <div className="self-center [grid-area:main]">
              <Teaser />
            </div>
            <div className="self-end justify-self-center [grid-area:bottom-nav]">
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
