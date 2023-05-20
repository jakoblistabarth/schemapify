"use client";

import { FC } from "react";
import useAppStore from "../helpers/store";
import { MdClose } from "react-icons/md";
import FileSelect from "./FileSelect";
import { GroupedTestFiles } from "../helpers/getGroupedTestFiles";

type Props = {
  files: GroupedTestFiles;
};

const Configurator: FC<Props> = ({ files }) => {
  const { source, removeSource } = useAppStore();

  return (
    <>
      <div className="relative z-above-map float-left ml-3">
        <div className="mb-2">
          <FileSelect files={files} />
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
      </div>
    </>
  );
};

export default Configurator;
