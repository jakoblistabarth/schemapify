"use client";

import * as Select from "@radix-ui/react-select";
import { FC, Fragment } from "react";
import { GoChevronDown, GoChevronUp } from "react-icons/go";
import { GroupedTestFiles } from "../helpers/getGroupedTestFiles";
import useAppStore from "../helpers/store";
import SelectItem from "./SelectItem";

type Props = { files: GroupedTestFiles };

const FileSelect: FC<Props> = ({ files }) => {
  const { setSource, source } = useAppStore();

  const allFiles = Object.values(files).flat();
  // Items are keyed by url, not name: the same name exists in several formats
  // (e.g. AUT_adm1-simple as .json, .fgb and .gpkg).
  // An uploaded file has no matching item, which would leave the trigger
  // blank; fall back to the placeholder in that case.
  const selected = allFiles.find((d) => d.name === source?.name)?.url;

  return (
    <Select.Root
      value={selected}
      onValueChange={(url) => {
        const file = allFiles.find((d) => d.url === url);
        if (file) setSource(file);
      }}
      key={selected ?? ""}
    >
      <Select.Trigger
        className="gap--1.25 inline-flex h-8.75 items-center justify-center rounded bg-white px-4 text-sm leading-none shadow outline-none hover:bg-blue-50 focus:shadow-[0_0_0_2px] focus:shadow-black data-placeholder:text-blue-900"
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
                      <SelectItem key={d.url} value={d.url}>
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
