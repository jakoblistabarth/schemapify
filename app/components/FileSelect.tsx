"use client";

import { FC, Fragment } from "react";
import useAppStore from "../helpers/store";
import * as Select from "@radix-ui/react-select";
import { GoChevronDown, GoChevronUp } from "react-icons/go";
import SelectItem from "./SelectItem";
import { GroupedTestFiles } from "../helpers/getGroupedTestFiles";

type Props = { files: GroupedTestFiles };

const FileSelect: FC<Props> = ({ files }) => {
  const { setSource, source } = useAppStore();

  return (
    <Select.Root
      value={source?.name ?? undefined}
      onValueChange={(value) => setSource(value)}
      key={source?.name ?? ""}
    >
      <Select.Trigger
        className="gap--1.25 inline-flex h-8.75 items-center justify-center rounded bg-white px-4 text-[13px] leading-none shadow-[0_2px_10px] shadow-black/10 outline-none hover:bg-blue-50 focus:shadow-[0_0_0_2px] focus:shadow-black data-placeholder:text-blue-900"
        aria-label="Select File"
      >
        <Select.Value placeholder="Select a file…" />
        <Select.Icon>
          <GoChevronDown />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="overflow-hidden rounded-md bg-white shadow-[0px_10px_38px_-10px_rgba(22,23,24,0.35),0px_10px_20px_-15px_rgba(22,23,24,0.2)]">
          <Select.ScrollUpButton className="flex h-6.25 cursor-default items-center justify-center bg-white">
            <GoChevronUp />
          </Select.ScrollUpButton>
          <Select.Viewport className="p-1.25">
            {files &&
              Object.entries(files).map(([groupName, filesInGroup], i) => (
                <Fragment key={groupName}>
                  <Select.Group>
                    <Select.Label className="px-6.25 text-xs leading-6.25">
                      {groupName}
                    </Select.Label>
                    {filesInGroup.map((d) => (
                      <SelectItem key={d.name} value={d.name}>
                        {d.name} ({d.size})
                      </SelectItem>
                    ))}
                  </Select.Group>
                  {i + 1 < Object.keys(files).length && (
                    <Select.Separator className="my-4 h-px bg-blue-300" />
                  )}
                </Fragment>
              ))}
          </Select.Viewport>
          <Select.ScrollDownButton className="flex h-6.25 cursor-default items-center justify-center bg-white">
            <GoChevronDown />
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
};

export default FileSelect;
