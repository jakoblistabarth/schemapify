"use client";

import { formatCrs } from "@/src/Input/Crs";
import { MAX_VERTEX_COUNT } from "@/src/utilities";
import { FC, useMemo } from "react";
import { MdClose } from "react-icons/md";
import { GroupedTestFiles } from "../helpers/getGroupedTestFiles";
import useAppStore from "../helpers/store";
import Button from "./Button";
import CConfigurator from "./CConfigurator";
import FileSelect from "./FileSelect";
import FileUpload from "./FileUpload";

type Props = {
  files: GroupedTestFiles;
};

const Configurator: FC<Props> = ({ files }) => {
  const {
    source,
    sourceError,
    removeSource,
    activeSnapshot,
    isSchematizing,
    schematizationProgress,
    schematizationError,
    cancelSchematization,
  } = useAppStore();
  const dcel = useMemo(() => {
    if (!activeSnapshot) return undefined;
    return activeSnapshot.subdivision.toDcel();
  }, [activeSnapshot]);

  const info = useMemo(() => {
    if (!dcel) return undefined;
    return {
      duration: `${activeSnapshot?.duration}ms`,
      vertices: dcel.vertices.size,
      halfEdges: dcel.halfEdges.size,
      faces: dcel.getBoundedFaces().length,
      area: dcel.getArea(),
    };
  }, [dcel, activeSnapshot]);

  return (
    <>
      <div className="relative float-left ml-3">
        <div className="mb-2">
          <FileSelect files={files} />
        </div>
        {!source && (
          <div className="mb-2">
            <FileUpload />
          </div>
        )}
        {sourceError && (
          <div className="mb-2 rounded-md bg-red-50 p-2 text-sm text-red-900">
            {sourceError}
          </div>
        )}
        {source && (
          <div className="rounded-md bg-white p-2">
            <div className="flex content-between items-center">
              {source.name}
              <button
                className="ml-5 rounded-full bg-blue-600 p-1 text-blue-50 transition-colors hover:bg-blue-950"
                onClick={() => removeSource()}
              >
                <MdClose />
              </button>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              {source.vertexCount} vertices · {formatCrs(source.crs)}
            </div>
            {source.skipped > 0 && (
              <div className="mt-1 text-xs text-gray-500">
                {source.skipped} non-polygonal feature
                {source.skipped === 1 ? "" : "s"} skipped
              </div>
            )}
            {source.vertexCount > MAX_VERTEX_COUNT && (
              <div className="mt-2 rounded bg-amber-50 p-2 text-xs text-amber-900">
                Above {MAX_VERTEX_COUNT} vertices. Schematization runs in a
                worker, so the interface stays responsive, but the run can take
                a while.
              </div>
            )}
          </div>
        )}
        {source && !activeSnapshot && !isSchematizing && <CConfigurator />}
        {isSchematizing && (
          <div className="mt-2 flex items-center justify-between gap-2 rounded-md bg-white p-2 text-sm">
            <span className="text-gray-500">
              <span className="text-shimmer">Schematizing</span>
              {schematizationProgress && (
                <>
                  {" · "}
                  <pre className="inline">{schematizationProgress.label}</pre> (
                  {schematizationProgress.step})
                </>
              )}
            </span>
            <Button onClick={cancelSchematization}>Cancel</Button>
          </div>
        )}
        {schematizationError && (
          <div className="mt-2 rounded-md bg-red-50 p-2 text-sm text-red-900">
            {schematizationError}
          </div>
        )}
        {activeSnapshot && (
          <div className="mt-2 rounded-md bg-white p-2 text-sm">
            <div className="mb-2 text-gray-500">
              Snapshot{" "}
              <pre className="inline font-black">{activeSnapshot.label}</pre>
            </div>
            <table>
              <tbody>
                {info &&
                  Object.entries(info).map(([key, value]) => (
                    <tr key={key}>
                      <td className="pr-4">{key}</td>
                      <td className="font-mono text-sm">{value}</td>
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
