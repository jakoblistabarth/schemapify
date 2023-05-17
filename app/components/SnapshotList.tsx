import { FC } from "react";
import useAppStore from "../helpers/store";
import { STEP } from "@/src/DCEL/Dcel";

const SnapshotList: FC = () => {
  const { dcel, setActiveSnapshot, activeSnapshot } = useAppStore();

  if (!dcel?.snapShots) return <></>;
  const snapShots = Object.entries(dcel.snapShots).sort(
    ([, a], [_, b]) => (a.time ?? 0) - (b.time ?? 0)
  );
  const startTime = snapShots[0][1].time;
  return (
    <div className="mt-2 rounded-md bg-white p-2">
      <h2 className="mb-2 pl-2 text-xs font-bold">Algorithm steps</h2>
      <ul className="list-none pl-0">
        {snapShots.map(([name, snapshot]) => (
          <li
            key={name}
            className="flex w-full cursor-pointer items-baseline justify-between rounded px-2 py-1 transition-colors duration-500 hover:bg-blue-50"
            onClick={() => setActiveSnapshot(name as STEP)}
          >
            <span className={name === activeSnapshot ? "font-bold" : ""}>
              {name}
            </span>
            <span className="font-mono text-xs">
              {snapshot.time && snapshot.time - (startTime ?? 0)}ms
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SnapshotList;
