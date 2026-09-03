"use client";

import C from "@/src/c-oriented-schematization/C";
import CIrregular from "@/src/c-oriented-schematization/CIrregular";
import CRegular from "@/src/c-oriented-schematization/CRegular";
import {
  formatAngles,
  parseAngles,
} from "@/src/c-oriented-schematization/CConfig";
import { degreesToRadians, radiansToDegrees } from "@/src/utilities";
import * as Slider from "@radix-ui/react-slider";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import clsx from "clsx";
import { range } from "d3";
import { FC, useMemo, useState } from "react";
import { RiArrowLeftLine, RiArrowRightLine } from "react-icons/ri";
import useAppStore, { CConfig } from "../helpers/store";
import Button from "./Button";
import CPreview from "./CPreview";

type Props = {
  /** Leaves the configurator without running, only offered when there is a run to return to. */
  onCancel?: () => void;
  /** Called after a run was requested, so the caller can close the configurator. */
  onSubmit?: () => void;
};

const CConfigurator: FC<Props> = ({ onCancel, onSubmit }) => {
  const { runSchematization, cConfig } = useAppStore();
  const [type, setType] = useState<CConfig["type"]>(cConfig?.type ?? "regular");
  const [orientations, setOrientations] = useState<number>(
    cConfig?.type === "regular" ? cConfig.orientations : 4,
  );
  const [betaDegrees, setBetaDegrees] = useState<number>(
    cConfig?.type === "regular" ? radiansToDegrees(cConfig.beta) : 0,
  );
  const [angles, setAngles] = useState<string>(
    cConfig?.type === "irregular"
      ? formatAngles(cConfig.angles)
      : "0, 30, 90, 150",
  );
  const betaMaxDegrees =
    type === "regular" ? 180 / Math.max(orientations, 2) : 180;
  const normalizedBetaDegrees = Math.min(betaDegrees, betaMaxDegrees);

  // A half-typed set of angles is not a C, so building it is allowed to fail
  // and the error is shown rather than thrown.
  const { c, error } = useMemo<{ c?: C; error?: string }>(() => {
    try {
      if (type === "regular")
        return {
          c: new CRegular(
            orientations,
            degreesToRadians(normalizedBetaDegrees),
          ),
        };
      return { c: new CIrregular(parseAngles(angles)) };
    } catch (e) {
      return {
        error: e instanceof Error ? e.message : "Invalid set of angles.",
      };
    }
  }, [type, orientations, normalizedBetaDegrees, angles]);

  const handleStart = () => {
    if (!c) return;
    const config =
      type === "regular"
        ? {
            type: "regular" as const,
            orientations,
            beta: degreesToRadians(normalizedBetaDegrees),
          }
        : {
            type: "irregular" as const,
            angles: c.angles,
          };

    runSchematization(config);
    onSubmit?.();
  };

  const isCType = (value: string): value is CConfig["type"] => {
    return value === "regular" || value === "irregular";
  };

  return (
    <div className="mt-2 rounded-md bg-white p-3 text-sm shadow">
      <div className="mb-3 font-semibold text-gray-700">
        Configure{" "}
        <em className="fonto-mono font-black text-blue-500 not-italic">C</em>{" "}
        set of orientations
      </div>

      <div className="mb-3 flex items-center justify-center gap-2">
        <ToggleGroup.Root
          type="single"
          value={type}
          onValueChange={(value) => {
            if (isCType(value)) setType(value);
          }}
          className="inline-flex space-x-px rounded bg-white shadow"
        >
          <ToggleGroup.Item
            className="flex cursor-pointer items-center justify-center gap-1 bg-white p-1 px-2 first:rounded-l last:rounded-r hover:bg-blue-100 data-[state=on]:bg-blue-200 data-[state=on]:text-blue-500"
            value="regular"
          >
            <CRegularIcon />
            Regular
          </ToggleGroup.Item>
          <ToggleGroup.Item
            className="flex cursor-pointer items-center justify-center gap-1 bg-white p-1 px-2 first:rounded-l last:rounded-r hover:bg-blue-100 data-[state=on]:bg-blue-200 data-[state=on]:text-blue-500"
            value="irregular"
          >
            Irregular
            <CIrregularIcon />
          </ToggleGroup.Item>
        </ToggleGroup.Root>
      </div>

      {c ? (
        <CPreview c={c} />
      ) : (
        <div className="mb-3 rounded bg-red-50 p-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {type === "regular" ? (
        <>
          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-gray-600">
              No. of Orientations
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={orientations}
                step={1}
                max={6}
                min={2}
                onChange={(e) =>
                  setOrientations(parseFloat(e.target.value) || 0)
                }
                className="rounded border border-gray-300 px-2 py-1 text-xs"
              />
              <Slider.Root
                className="relative flex h-5 w-full touch-none items-center select-none"
                onValueChange={(value) => setOrientations(value[0])}
                value={[orientations]}
                max={6}
                min={2}
                step={1}
              >
                <Slider.Track className="relative h-0.5 grow rounded-full bg-blue-700">
                  <Slider.Range className="absolute h-full rounded-full bg-blue-200" />
                </Slider.Track>
                <Slider.Thumb
                  className="block size-3 cursor-pointer rounded-full border border-blue-500 bg-white shadow shadow-blue-500 hover:bg-blue-50 focus:shadow-[0_0_0_3px] focus:shadow-black/50 focus:outline-none"
                  aria-label="Volume"
                />
              </Slider.Root>
            </div>
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Beta-Shift (degrees)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={betaDegrees}
                step={1}
                max={betaMaxDegrees}
                min={0}
                onChange={(e) =>
                  setBetaDegrees(
                    Math.min(parseFloat(e.target.value) || 0, betaMaxDegrees),
                  )
                }
                className="rounded border border-gray-300 px-2 py-1 text-xs"
              />
              <Slider.Root
                className="relative flex h-5 w-full touch-none items-center select-none"
                onValueChange={(value) => setBetaDegrees(value[0])}
                value={[normalizedBetaDegrees]}
                max={betaMaxDegrees}
                min={0}
                step={1}
              >
                <Slider.Track className="relative h-0.5 grow rounded-full bg-blue-700">
                  <Slider.Range className="absolute h-full rounded-full bg-blue-200" />
                </Slider.Track>
                <Slider.Thumb
                  className="block size-3 cursor-pointer rounded-full border border-blue-500 bg-white shadow shadow-blue-500 hover:bg-blue-50 focus:shadow-[0_0_0_3px] focus:shadow-black/50 focus:outline-none"
                  aria-label="Volume"
                />
              </Slider.Root>
            </div>
          </div>
        </>
      ) : (
        <div className="mb-3">
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Angles (comma-separated, degrees)
          </label>
          <input
            type="text"
            value={angles}
            onChange={(e) => setAngles(e.target.value)}
            className="w-full rounded border border-gray-300 px-2 py-1 font-mono text-xs"
          />
        </div>
      )}
      <div
        className={clsx(
          "gap flex",
          onCancel ? "justify-between" : "justify-end",
        )}
      >
        {onCancel && (
          <Button onClick={onCancel}>
            <RiArrowLeftLine className="mr-1" />
            Back
          </Button>
        )}
        <Button variant="primary" onClick={handleStart} disabled={!c}>
          {onCancel ? "Restart" : "Continue"}
          <RiArrowRightLine className="ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default CConfigurator;

const CIrregularIcon: FC<{ size?: number }> = ({ size = 20 }) => {
  const angles = [20, 90, 160].flatMap((i) => [i, i + 180]).toSorted();
  return (
    <svg width={size} height={size}>
      <g
        fill="none"
        stroke="currentColor"
        transform={`translate(${size / 2}, ${size / 2})`}
      >
        {angles.map((i) => (
          <line key={i} x2={size / 2 - 2} transform={`rotate(${i})`} />
        ))}
      </g>
    </svg>
  );
};

const CRegularIcon: FC<{ size?: number }> = ({ size = 20 }) => {
  const angles = range(6).map((i, _, arr) => (360 / arr.length) * i);
  return (
    <svg width={size} height={size}>
      <g
        fill="none"
        stroke="currentColor"
        transform={`translate(${size / 2}, ${size / 2})`}
      >
        {angles.map((i) => (
          <line key={i} x2={size / 2 - 2} transform={`rotate(${i})`} />
        ))}
      </g>
    </svg>
  );
};
