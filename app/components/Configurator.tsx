"use client";

import { FC } from "react";
import { MdClose } from "react-icons/md";
import { GroupedTestFiles } from "../helpers/getGroupedTestFiles";
import { useDcelStore } from "../providers/dcel-store-provider";
import FileSelect from "./FileSelect";

type Props = {
  files: GroupedTestFiles;
};

const Configurator: FC<Props> = ({ files }) => {
  const { source, removeSource } = useDcelStore((state) => state);

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
