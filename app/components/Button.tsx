import clsx from "clsx";
import {
  ButtonHTMLAttributes,
  DetailedHTMLProps,
  FC,
  PropsWithChildren,
} from "react";

type Props = PropsWithChildren<
  {
    primary?: boolean;
  } & DetailedHTMLProps<
    ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >
>;

const Button: FC<Props> = ({ className, children, primary, ...rest }) => (
  <button
    className={clsx(
      "flex items-center rounded-sm px-2 py-1 hover:cursor-pointer focus:z-10 focus:shadow-[0_0_0_2px] focus:shadow-black focus:outline-none disabled:cursor-not-allowed disabled:hover:bg-white",
      primary
        ? "bg-blue-600 text-blue-100 hover:bg-blue-900"
        : "bg-white p-1 transition-colors hover:bg-blue-50 active:bg-blue-200",
      className,
    )}
    {...rest}
  >
    {children}
  </button>
);

export default Button;
