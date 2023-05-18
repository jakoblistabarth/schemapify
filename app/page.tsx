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

const Home = () => {
  const { dcel, setDcel } = useAppStore();

  useHotkeys(["ctrl+s"], () => handleSimplify(setDcel, dcel));

  return (
    <>
      <div className="grid h-screen grid-cols-1 grid-rows-1">
        <main className="relative">
          <div className="relative mt-4 flex justify-center">
            <Brand />
          </div>
          <MapView />
          <div className="grid grid-cols-[1fr_3fr]">
            <div>
              <Configurator />
              <FileSelect />
            </div>
            {!dcel && <Teaser />}
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Home;
