import clsx from "clsx";
import {
  ButtonHTMLAttributes,
  DetailedHTMLProps,
  FC,
  PropsWithChildren,
} from "react";

type Props = PropsWithChildren<
  {
    variant?: "primary" | "ghost";
  } & DetailedHTMLProps<
    ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >
>;

const Button: FC<Props> = ({ className, children, variant, ...rest }) => (
  <button
    className={clsx(
      "flex cursor-pointer items-center rounded-sm bg-blue-50 px-2 py-1 transition-colors duration-1000 hover:cursor-pointer hover:bg-blue-200 focus:z-10 focus:shadow-[0_0_0_2px] focus:shadow-black focus:outline-none disabled:cursor-not-allowed disabled:hover:bg-white",
      variant === "primary" && "bg-blue-600 text-blue-100 hover:bg-blue-900",
      variant === "ghost" && "bg-white p-1 hover:bg-blue-50 active:bg-blue-200",
      className,
    )}
    {...rest}
  >
    {children}
  </button>
);

export default Button;
