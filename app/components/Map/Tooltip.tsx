import { FC } from "react";
import { Tooltip as LTooltip } from "react-leaflet";

type Props = {
  featureProperties: { [key: string]: string | number };
};

const Tooltip: FC<Props> = ({ featureProperties }) => (
  <LTooltip>
    {Object.entries(featureProperties).map(([key, value]) => (
      <div key={key}>
        <strong>{key}</strong> {value}
      </div>
    ))}
  </LTooltip>
);

export default Tooltip;
