"use client";

import { FC, useMemo } from "react";
import useAppStore from "../helpers/store";
import { MdClose } from "react-icons/md";
import FileSelect from "./FileSelect";
import { GroupedTestFiles } from "../helpers/getGroupedTestFiles";

type Props = {
  files: GroupedTestFiles;
};

const Configurator: FC<Props> = ({ files }) => {
  const { source, removeSource, activeSnapshot } = useAppStore();
  const dcel = useMemo(() => {
    if (!activeSnapshot) return undefined;
    return activeSnapshot.subdivision.toDcel();
  }, [activeSnapshot]);

  const info = useMemo(() => {
    if (!dcel) return undefined;
    return {
      duration: activeSnapshot?.duration,
      vertices: dcel.vertices.size,
      halfEdges: dcel.halfEdges.size,
      faces: dcel.getBoundedFaces().length,
    };
  }, [dcel, activeSnapshot]);

  return (
    <>
      <div className="relative float-left ml-3">
        <div className="mb-2">
          <FileSelect files={files} />
        </div>
        {source && (
          <div className="flex content-between items-center rounded-md bg-white p-2">
            {source?.name}
            {source && (
              <button
                className="ml-5 rounded-full bg-blue-600 p-1 text-blue-50 transition-colors hover:bg-blue-950"
                onClick={() => removeSource()}
              >
                <MdClose />
              </button>
            )}
          </div>
        )}
        {activeSnapshot && (
          <div className="mt-2 rounded-md bg-white p-2">
            <div className="text-sm text-gray-500">
              Snapshot{" "}
              <pre className="inline font-black">{activeSnapshot.label}</pre>
            </div>
            <table>
              <tbody>
                {info &&
                  Object.entries(info).map(([key, value]) => (
                    <tr key={key}>
                      <td>{key}</td>
                      <td>{value}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default Configurator;
