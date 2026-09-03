"use client";

import { formatCrs } from "@/src/Input/Crs";
import { formatFloat, formatInteger, MAX_VERTEX_COUNT } from "@/src/utilities";
import { FC, useEffect, useMemo, useState } from "react";
import { MdClose } from "react-icons/md";
import { RiSettings3Line } from "react-icons/ri";
import { GroupedTestFiles } from "../helpers/getGroupedTestFiles";
import useAppStore from "../helpers/store";
import Button from "./Button";
import CConfigurator from "./CConfigurator";
import ExportMenu from "./ExportMenu";
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
  const [isConfiguring, setIsConfiguring] = useState(false);

  // A new source starts over from the configurator, so the reopened one must not linger.
  useEffect(() => setIsConfiguring(false), [source]);

  const dcel = useMemo(() => {
    if (!activeSnapshot) return undefined;
    return activeSnapshot.subdivision.toDcel();
  }, [activeSnapshot]);

  const info = useMemo(() => {
    if (!dcel) return undefined;
    return {
      duration: `${activeSnapshot?.duration}ms`,
      vertices: formatInteger(dcel.vertices.size),
      halfEdges: formatInteger(dcel.halfEdges.size),
      faces: formatInteger(dcel.getBoundedFaces().length),
      area: formatFloat(dcel.getArea()),
    };
  }, [dcel, activeSnapshot]);

  return (
    <>
      <div className="relative ml-3 w-72">
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
              {formatInteger(source.vertexCount)} vertices ·{" "}
              {formatCrs(source.crs)}
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
        {source && !isSchematizing && (!activeSnapshot || isConfiguring) && (
          <CConfigurator
            onCancel={
              activeSnapshot ? () => setIsConfiguring(false) : undefined
            }
            onSubmit={() => setIsConfiguring(false)}
          />
        )}
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
        {activeSnapshot && !isConfiguring && (
          <div className="mt-2 rounded-md bg-white p-2 text-sm">
            <div className="mb-2 flex items-center justify-between gap-2 text-gray-500">
              <span>
                Snapshot{" "}
                <pre className="inline font-black">{activeSnapshot.label}</pre>
              </span>
              <Button onClick={() => setIsConfiguring(true)}>
                <RiSettings3Line className="mr-1" />
                Configure
              </Button>
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
        {activeSnapshot && !isConfiguring && <ExportMenu />}
      </div>
    </>
  );
};

export default Configurator;
