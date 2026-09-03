"use client";

import { formatCrs } from "@/src/Input/Crs";
import type { OutputFormat } from "@/src/Output";
import { canExportGeoJson } from "@/src/Output";
import { FC, useState } from "react";
import { RiDownload2Line } from "react-icons/ri";
import {
  download,
  formatsOf,
  outputFormats,
  outputGroups,
  toExportFile,
  type OutputGroup,
} from "../helpers/exportSnapshot";
import useAppStore from "../helpers/store";
import Button from "./Button";

/**
 * Offers the active snapshot for download, grouped by what the file is for:
 * geodata that carries the coordinate reference system, or graphics to take
 * into vector software.
 *
 * GeoJSON is the exception within its group — RFC 7946 mandates WGS84, so it
 * is only offered for data already in that CRS. FlatGeobuf covers the same
 * ground for everything else, since it records the CRS in its header.
 */
const ExportMenu: FC = () => {
  const { activeSnapshot, source } = useAppStore();
  const [pending, setPending] = useState<OutputFormat>();
  const [error, setError] = useState<string>();

  if (!activeSnapshot || !source) return null;

  const isWgs84 = canExportGeoJson(source.crs);

  const handleExport = async (format: OutputFormat) => {
    setPending(format);
    setError(undefined);
    try {
      const { blob, fileName } = await toExportFile(
        activeSnapshot.subdivision,
        format,
        source,
      );
      download(blob, fileName);
    } catch (error) {
      setError(
        `Could not export as ${outputFormats[format].label}: ${
          error instanceof Error ? error.message : "unknown error"
        }`,
      );
    } finally {
      setPending(undefined);
    }
  };

  return (
    <div className="mt-2 rounded-md bg-white p-2 text-sm">
      <div className="mb-2 flex items-center gap-1 text-gray-500">
        <RiDownload2Line />
        Export
      </div>
      {(Object.keys(outputGroups) as OutputGroup[]).map((group) => (
        <div key={group} className="mb-2 last:mb-0">
          <div className="mb-1 text-xs text-gray-500">
            {outputGroups[group].label}
            <span className="text-gray-400"> · {outputGroups[group].hint}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {formatsOf(group).map((format) => {
              const isUnavailable = format === "geojson" && !isWgs84;
              return (
                <Button
                  key={format}
                  className="disabled:opacity-40"
                  disabled={!!pending || isUnavailable}
                  onClick={() => handleExport(format)}
                  title={
                    isUnavailable
                      ? `GeoJSON is WGS84 only, this data is ${formatCrs(source.crs)}. Use FlatGeobuf or GeoPackage instead.`
                      : undefined
                  }
                >
                  {pending === format
                    ? "Exporting…"
                    : outputFormats[format].label}
                </Button>
              );
            })}
          </div>
        </div>
      ))}
      {!isWgs84 && (
        <div className="mt-2 text-xs text-gray-500">
          GeoJSON is unavailable: it is WGS84 only, this data is{" "}
          {formatCrs(source.crs)}. GeoPackage and FlatGeobuf keep it.
        </div>
      )}
      {error && (
        <div className="mt-2 rounded bg-red-50 p-2 text-xs text-red-900">
          {error}
        </div>
      )}
    </div>
  );
};

export default ExportMenu;
