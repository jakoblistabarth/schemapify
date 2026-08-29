import * as Select from "@radix-ui/react-select";
import clsx from "clsx";
import React, { PropsWithChildren } from "react";
import { GoCheck } from "react-icons/go";

type Props = PropsWithChildren<Select.SelectItemProps>;

const SelectItem = React.forwardRef<HTMLDivElement, Props>(function SelectItem(
  { children, className, ...props },
  forwardedRef,
) {
  return (
    <Select.Item
      className={clsx(
        "relative flex h-[25px] items-center rounded-[3px] pr-[35px] pl-[25px] text-sm leading-none text-blue-800 select-none data-[disabled]:pointer-events-none data-[disabled]:text-slate-600 data-[highlighted]:bg-blue-600 data-[highlighted]:text-blue-100 data-[highlighted]:outline-none",
        className,
      )}
      {...props}
      ref={forwardedRef}
    >
      <Select.ItemText>{children}</Select.ItemText>
      <Select.ItemIndicator className="absolute left-0 inline-flex w-[25px] items-center justify-center">
        <GoCheck />
      </Select.ItemIndicator>
    </Select.Item>
  );
});

export default SelectItem;
