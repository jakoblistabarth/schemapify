import { FC } from "react";
import useAppStore from "../helpers/store";
import SnapshotTimeline from "./SnapshotTimeline";
import {
  RiCamera3Line,
  RiSkipBackLine,
  RiSkipForwardLine,
} from "react-icons/ri";
import Button from "./Button";
import { useHotkeys } from "react-hotkeys-hook";
import { extent, scaleLinear } from "d3";

const SnapshotList: FC = () => {
  const { dcel, activeSnapshot, setActiveSnapshot } = useAppStore();

  if (!dcel?.snapshotList.hasSnapshots()) return <></>;

  const [durationMin, durationMax] = extent(
    dcel.snapshotList.snapshots.map((d) => d.duration)
  );
  const colorScale = scaleLinear<string, string>()
    .domain([durationMin ?? 0, durationMax ?? 1])
    .range(["rgb(200, 215, 255)", "rgb(0,0,150)"]);

  const [prevId, nextId] = activeSnapshot
    ? dcel.snapshotList.getPrevNext(activeSnapshot.id)
    : [undefined, undefined];

  useHotkeys(["left"], () => (prevId ? setActiveSnapshot(prevId) : undefined));
  useHotkeys(["right"], () => (nextId ? setActiveSnapshot(nextId) : undefined));

  const snapshotsByStep = dcel.snapshotList.getSnapshotByStep();

  return (
    <div className="self-align-middle relative z-above-map mx-auto mb-5 flex items-center justify-between gap-2 rounded-md bg-white p-1 px-2">
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
          onClick={() => (prevId ? setActiveSnapshot(prevId) : undefined)}
          disabled={!!!prevId}
        >
          <RiSkipBackLine size={15} />
        </Button>
        <Button
          className="p-2 transition-opacity duration-500 disabled:pointer-events-none disabled:opacity-20"
          onClick={() => (nextId ? setActiveSnapshot(nextId) : undefined)}
          disabled={!!!nextId}
        >
          <RiSkipForwardLine size={15} />
        </Button>
      </div>
    </div>
  );
};

export default SnapshotList;
