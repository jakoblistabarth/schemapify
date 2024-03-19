import * as Select from "@radix-ui/react-select";
import React, { PropsWithChildren } from "react";
import { GoCheck } from "react-icons/go";
import clsx from "clsx";

type Props = PropsWithChildren<Select.SelectItemProps>;

const SelectItem = React.forwardRef<HTMLDivElement, Props>(function SelectItem(
  { children, className, ...props },
  forwardedRef,
) {
  return (
    <Select.Item
      className={clsx(
        "relative flex h-[25px] select-none items-center rounded-[3px] pl-[25px] pr-[35px] text-[13px] leading-none text-blue-800 data-[disabled]:pointer-events-none data-[highlighted]:bg-blue-600 data-[disabled]:text-slate-600 data-[highlighted]:text-blue-100 data-[highlighted]:outline-none",
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
