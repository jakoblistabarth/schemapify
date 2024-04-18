"use client";

import * as Select from "@radix-ui/react-select";
import { FC, Fragment } from "react";
import { GoChevronDown, GoChevronUp } from "react-icons/go";
import { GroupedTestFiles } from "../helpers/getGroupedTestFiles";
import { useDcelStore } from "../providers/dcel-store-provider";
import SelectItem from "./SelectItem";

type Props = { files: GroupedTestFiles };

const FileSelect: FC<Props> = ({ files }) => {
  const { setSource, source } = useDcelStore((state) => state);

  return (
    <Select.Root
      value={source?.name ?? undefined}
      onValueChange={(value) => setSource(value)}
      key={source?.name ?? ""}
    >
      <Select.Trigger
        className="inline-flex h-[35px] items-center justify-center gap-[5px] rounded bg-white px-[15px] text-[13px] leading-none shadow-[0_2px_10px] shadow-black/10 outline-none hover:bg-blue-50 focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-blue-900"
        aria-label="Select File"
      >
        <Select.Value placeholder="Select a file…" />
        <Select.Icon>
          <GoChevronDown />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="z-above-map overflow-hidden rounded-md bg-white shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)]">
          <Select.ScrollUpButton className="flex h-[25px] cursor-default items-center justify-center bg-white">
            <GoChevronUp />
          </Select.ScrollUpButton>
          <Select.Viewport className="p-[5px]">
            {files &&
              Object.entries(files).map(([groupName, filesInGroup], i) => (
                <Fragment key={groupName}>
                  <Select.Group>
                    <Select.Label className="px-[25px] text-xs leading-[25px]">
                      {groupName}
                    </Select.Label>
                    {filesInGroup.map((d) => (
                      <SelectItem key={d.name} value={d.name}>
                        {d.name} ({d.size})
                      </SelectItem>
                    ))}
                  </Select.Group>
                  {i + 1 < Object.keys(files).length && (
                    <Select.Separator className="my-4 h-[1px] bg-blue-300" />
                  )}
                </Fragment>
              ))}
          </Select.Viewport>
          <Select.ScrollDownButton className="flex h-[25px] cursor-default items-center justify-center bg-white">
            <GoChevronDown />
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
};

export default FileSelect;
