import C from "@/src/c-oriented-schematization/C";
import CRegular from "@/src/c-oriented-schematization/CRegular";
import clsx from "clsx";
import { FC, Fragment } from "react";

type Props = {
  c?: C;
};

const CPreview: FC<Props> = ({ c }) => {
  const size = 200;
  const angles =
    c instanceof CRegular
      ? c.angles
      : c?.angles.flatMap((d) => [d, d + Math.PI]).toSorted();
  return (
    <div className="mb-5 flex aspect-square w-full items-center justify-center rounded bg-slate-100 p-2">
      <svg width={size} height={size}>
        <g
          strokeLinecap="round"
          transform={`translate(${size / 2}, ${size / 2})`}
        >
          {angles?.map((angle, i) => {
            const isPrimary = i < angles.length / 2;
            const angleInDegrees = (angle * 180) / Math.PI;
            const labelRadius = size * 0.4;
            const labelX = Math.cos(angle) * labelRadius;
            const labelY = -Math.sin(angle) * labelRadius;
            return (
              <Fragment key={i}>
                <line
                  key={i}
                  x2={size / 2 - 10}
                  transform={`rotate(${-angleInDegrees})`}
                  className={clsx(
                    isPrimary ? "stroke-blue-500" : "stroke-blue-100",
                  )}
                />
                {isPrimary && (
                  <text
                    x={labelX}
                    y={labelY}
                    textAnchor="middle"
                    className="fill-blue-500 stroke-blue-50 stroke-4 text-xs font-bold"
                    dominantBaseline="middle"
                    paintOrder="stroke"
                  >
                    {i + 1}
                  </text>
                )}
              </Fragment>
            );
          })}
          <circle
            r={size / 2 - 5}
            className="fill-none stroke-blue-100"
            strokeDasharray="20 2"
          />
          <circle r={4} className="stroke-blue-50" strokeWidth={3} />
        </g>
      </svg>
    </div>
  );
};

export default CPreview;
