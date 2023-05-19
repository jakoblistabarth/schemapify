"use client";

import Footer from "./components/Footer";
import Brand from "./components/Brand";
import FileSelect from "./components/FileSelect";
import Configurator from "./components/Configurator";
import { handleSimplify } from "./helpers/handleSimplify";
import useAppStore from "./helpers/store";
import MapView from "./components/MapView";
import { useHotkeys } from "react-hotkeys-hook";
import Teaser from "./components/Teaser";
import SnapshotList from "./components/SnapshotNavigator";

const Home = () => {
  const { dcel, setDcel, removeSource, setSource } = useAppStore();

  useHotkeys(["ctrl+s"], () => handleSimplify(setDcel, dcel));
  useHotkeys(["ctrl+c"], () => removeSource());
  useHotkeys(["ctrl+1"], () => setSource("AUT_adm0-s0_5.json"));

  return (
    <>
      <div className="relative grid h-screen grid-cols-1 grid-rows-1">
        <main className="relative">
          <MapView />
          <div className="grid h-full grid-cols-[2fr_5fr] grid-rows-[auto_6fr_auto] grid-areas-[header_header,sidebar_main,bottom-nav_bottom-nav]">
            <div className="mt-5 self-start justify-self-center grid-in-[header]">
              <Brand />
            </div>
            <div className="self-start justify-self-start grid-in-[sidebar]">
              <Configurator />
              <FileSelect />
            </div>
            <div className="self-center grid-in-[main]">
              {!dcel && <Teaser />}
            </div>
            <div className="self-end justify-self-center grid-in-[bottom-nav]">
              {dcel && <SnapshotList />}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Home;
