"use client";

import { extent, scaleLinear } from "d3";
import { FC } from "react";
import {
  RiCamera3Line,
  RiSkipBackLine,
  RiSkipForwardLine,
} from "react-icons/ri";
import { useDcelStore } from "../providers/dcel-store-provider";
import Button from "./Button";
import SnapshotTimeline from "./SnapshotTimeline";

const SnapshotList: FC = () => {
  const { dcel, nextSnapshot, prevSnapshot, setActiveSnapshot } = useDcelStore(
    (state) => state,
  );

  if (!dcel?.snapshotList.hasSnapshots()) return <></>;

  const [durationMin, durationMax] = extent(
    dcel.snapshotList.snapshots.map((d) => d.duration),
  );
  const colorScale = scaleLinear<string, string>()
    .domain([durationMin ?? 0, durationMax ?? 1])
    .range(["rgb(200, 215, 255)", "rgb(0,0,150)"]);

  const snapshotsByStep = dcel.snapshotList.getSnapshotByStep();

  return (
    <div className="relative z-above-map mx-auto flex items-center justify-between gap-2 rounded-md bg-white p-1 px-2">
      <h2 className="flex justify-between gap-1 text-xs font-bold">
        <RiCamera3Line size={15} />
        Snapshots
      </h2>
      {snapshotsByStep.map(([step, snapshots]) => (
        <div key={step}>
          <SnapshotTimeline colorScale={colorScale} snapshots={snapshots} />
        </div>
      ))}
      <div className="flex">
        <Button
          className="p-2 transition-opacity duration-500 disabled:pointer-events-none disabled:opacity-20"
          onClick={() =>
            prevSnapshot
              ? setActiveSnapshot(prevSnapshot.id, dcel.snapshotList)
              : undefined
          }
          disabled={!!!prevSnapshot}
        >
          <RiSkipBackLine />
        </Button>
        <Button
          className="p-2 transition-opacity duration-500 disabled:pointer-events-none disabled:opacity-20"
          onClick={() =>
            nextSnapshot
              ? setActiveSnapshot(nextSnapshot.id, dcel.snapshotList)
              : undefined
          }
          disabled={!!!nextSnapshot}
        >
          <RiSkipForwardLine />
        </Button>
      </div>
    </div>
  );
};

export default SnapshotList;
