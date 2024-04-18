"use client";

import Snapshot from "@/src/Snapshot/Snapshot";
import * as Tooltip from "@radix-ui/react-tooltip";
import clsx from "clsx";
import { ScaleLinear } from "d3";
import { FC } from "react";
import { useDcelStore } from "../providers/dcel-store-provider";

type Props = {
  snapshots: Snapshot[];
  colorScale: ScaleLinear<string, string, string>;
};

const SnapshotTimeline: FC<Props> = ({ snapshots, colorScale }) => {
  const { setActiveSnapshot, activeSnapshot, dcel } = useDcelStore(
    (state) => state,
  );
  const width = 10;
  const height = 25;
  const baseStrokeWidth = 2;
  const grow = 5;
  const gap = 2;

  return !dcel?.snapshotList ? (
    <></>
  ) : (
    <svg
      width={snapshots.length * width + (snapshots.length - 1) * gap + 2}
      height={height + 2}
    >
      {snapshots.map((d, i) => {
        const isActive = activeSnapshot?.id === d.id;
        return (
          <Tooltip.Provider key={`${d.id}`}>
            <Tooltip.Root open={isActive}>
              <Tooltip.Trigger asChild>
                <rect
                  x={width * i + gap * i + baseStrokeWidth / 2}
                  y={
                    isActive
                      ? baseStrokeWidth / 2
                      : (baseStrokeWidth + grow) / 2
                  }
                  rx={2}
                  width={width}
                  height={isActive ? height : height - grow}
                  fill={colorScale(d.duration)}
                  className={clsx(
                    "cursor-pointer stroke-transparent stroke-1 transition-all duration-100 hover:stroke-blue-600",
                    isActive && "stroke-blue-900 !stroke-2",
                  )}
                  onClick={() => setActiveSnapshot(d.id, dcel?.snapshotList)}
                />
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  className="data-[state=delayed-open]:data-[side=top]:animate-slideDownAndFade data-[state=delayed-open]:data-[side=right]:animate-slideLeftAndFade data-[state=delayed-open]:data-[side=left]:animate-slideRightAndFade data-[state=delayed-open]:data-[side=bottom]:animate-slideUpAndFade text-violet11 z-above-map select-none rounded-[4px] bg-white px-[15px] py-[10px] text-[15px] leading-none shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] will-change-[transform,opacity]"
                  sideOffset={10}
                >
                  <strong>{d.step}</strong>
                  <p>
                    {i + 1}/{snapshots.length} {d.duration}ms
                  </p>
                  <Tooltip.Arrow className="fill-white" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
        );
      })}
    </svg>
  );
};

export default SnapshotTimeline;
