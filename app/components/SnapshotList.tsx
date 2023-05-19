import { FC } from "react";
import useAppStore from "../helpers/store";
import { STEP, Snapshot } from "@/src/DCEL/Dcel";
import StepMap from "./StepMap";
import {
  RiCamera3Line,
  RiSkipBackLine,
  RiSkipForwardLine,
} from "react-icons/ri";
import Button from "./Button";
import { useHotkeys } from "react-hotkeys-hook";

const SnapshotList: FC = () => {
  const { dcel, activeSnapshot, setActiveSnapshot } = useAppStore();

  if (!dcel?.snapShots) return <></>;
  const snapShots = dcel.snapShots.sort(
    (a, b) => (a.time ?? 0) - (b.time ?? 0)
  );

  const activeSnapshotIndex = activeSnapshot
    ? dcel?.snapShots.map((d) => d.id).indexOf(activeSnapshot?.id)
    : undefined;

  const [prevId, nextId] = Array(2)
    .fill(activeSnapshotIndex)
    .map((d, i) => (i === 0 ? d - 1 : d + 1))
    .map((d) =>
      d != undefined && d >= 0 && d < dcel.snapShots.length
        ? dcel?.snapShots[d].id
        : undefined
    );

  useHotkeys(["left"], () => (prevId ? setActiveSnapshot(prevId) : undefined));
  useHotkeys(["right"], () => (nextId ? setActiveSnapshot(nextId) : undefined));

  const snapshotMap = snapShots.reduce<Map<STEP, Snapshot[]>>((acc, d) => {
    const snapShots = acc.get(d.step) ?? [];
    return acc.set(d.step, [...snapShots, d]);
  }, new Map<STEP, Snapshot[]>());

  const startTime = snapShots[0].time;
  return (
    <div className="self-align-middle relative z-above-map mx-auto mb-5 flex items-center justify-between gap-2 rounded-md bg-white p-1 px-2">
      <h2 className="flex justify-between gap-1 text-xs font-bold">
        <RiCamera3Line size={15} />
        Snapshots
      </h2>
      {Array.from(snapshotMap.entries()).map(([step, snapshots]) => (
        <div key={step}>
          <StepMap snapshots={snapshots} />
        </div>
      ))}
      <div className="flex">
        <Button
          className="p-2 disabled:pointer-events-none disabled:opacity-20"
          onClick={() => (prevId ? setActiveSnapshot(prevId) : undefined)}
          disabled={!!!prevId}
        >
          <RiSkipBackLine size={15} />
        </Button>
        <Button
          className="p-2 disabled:pointer-events-none disabled:opacity-20"
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
