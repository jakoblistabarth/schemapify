"use client";

import { FC } from "react";
import useAppStore from "../helpers/store";
import SnapshotTimeline from "./SnapshotTimeline";
import {
  RiCamera3Line,
  RiSkipBackLine,
  RiSkipForwardLine,
} from "react-icons/ri";
import Button from "./Button";
import { extent, scaleLinear } from "d3";

const SnapshotList: FC = () => {
  const { snapshotList, nextSnapshot, prevSnapshot, setActiveSnapshot } =
    useAppStore();

  if (!snapshotList?.hasSnapshots()) return <></>;

  const [durationMin, durationMax] = extent(
    snapshotList?.snapshots.map((d) => d.duration) ?? [],
  );
  const colorScale = scaleLinear<string, string>()
    .domain([durationMin ?? 0, durationMax ?? 1])
    .range(["rgb(200, 215, 255)", "rgb(0,0,150)"]);

  const snapshotsByStep = snapshotList?.getSnapshotByStep();

  return (
    <div className="self-align-middle relative z-above-map mx-auto mb-5 flex items-center justify-between gap-2 rounded-md bg-white p-1 px-2">
      <h2 className="flex justify-between gap-1 text-xs font-bold">
        <RiCamera3Line size={15} />
        Snapshots
      </h2>
      {snapshotsByStep?.map(([step, snapshots]) => (
        <div key={step}>
          <SnapshotTimeline colorScale={colorScale} snapshots={snapshots} />
        </div>
      ))}
      <div className="flex">
        <Button
          className="p-2 transition-opacity duration-500 disabled:pointer-events-none disabled:opacity-20"
          onClick={() =>
            prevSnapshot ? setActiveSnapshot(prevSnapshot.id) : undefined
          }
          disabled={!!!prevSnapshot}
        >
          <RiSkipBackLine size={15} />
        </Button>
        <Button
          className="p-2 transition-opacity duration-500 disabled:pointer-events-none disabled:opacity-20"
          onClick={() =>
            nextSnapshot ? setActiveSnapshot(nextSnapshot.id) : undefined
          }
          disabled={!!!nextSnapshot}
        >
          <RiSkipForwardLine size={15} />
        </Button>
      </div>
    </div>
  );
};

export default SnapshotList;
