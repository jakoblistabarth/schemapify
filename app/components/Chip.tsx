import clsx from "clsx";
import { FC, HTMLProps, PropsWithChildren } from "react";

type Props = PropsWithChildren<HTMLProps<HTMLDivElement>>;

const Chip: FC<Props> = ({ children, className, ...rest }) => (
  <div
    className={clsx(
      "border border-blue-800 bg-blue-50 px-2 py-0.5 text-xs",
      className,
      "inline-block rounded-full",
    )}
    {...rest}
  >
    {children}
  </div>
);

export default Chip;
