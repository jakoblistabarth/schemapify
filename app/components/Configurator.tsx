import { FC } from "react";
import useAppStore from "../helpers/store";
import { MdClose, MdFace } from "react-icons/md";
import SnapshotList from "./SnapshotList";
import FileSelect from "./FileSelect";

const Configurator: FC = () => {
  const { source, removeSource } = useAppStore();

  return (
    <>
      <div className="relative z-above-map float-left ml-3">
        <div className="mb-2">
          <FileSelect />
        </div>
        <div className="flex content-between items-center rounded-md bg-white p-2">
          {source?.name ?? <div>no file selected</div>}
          {source && (
            <button
              className="ml-5 rounded-full bg-blue-600 p-1 text-blue-50 transition-colors hover:bg-blue-950"
              onClick={() => removeSource()}
            >
              <MdClose />
            </button>
          )}
        </div>

        <SnapshotList />
      </div>
    </>
  );
};

export default Configurator;
