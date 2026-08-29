"use client";

import { DragEvent, FC, useRef, useState } from "react";
import { RiUploadLine } from "react-icons/ri";
import useAppStore from "../helpers/store";

/**
 * A drop target and file picker for user-supplied geodata.
 */
const FileUpload: FC = () => {
  const { setSourceFromFile } = useAppStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDraggedOver, setIsDraggedOver] = useState(false);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) setSourceFromFile(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggedOver(false);
    handleFiles(event.dataTransfer.files);
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(event) => {
        // Without this the browser navigates to the dropped file.
        event.preventDefault();
        setIsDraggedOver(true);
      }}
      onDragLeave={() => setIsDraggedOver(false)}
      onClick={() => inputRef.current?.click()}
      className={`flex cursor-pointer items-center gap-2 rounded-md border border-dashed p-2 text-sm transition-colors ${
        isDraggedOver
          ? "border-blue-600 bg-blue-50 text-blue-900"
          : "border-blue-300 bg-white text-blue-900 hover:bg-blue-50"
      }`}
    >
      <RiUploadLine />
      Drop a .fgb or .geojson file
      <input
        ref={inputRef}
        type="file"
        accept=".fgb,.geojson,.json"
        className="hidden"
        onChange={(event) => {
          handleFiles(event.target.files);
          // Allow re-selecting the same file after removing it.
          event.target.value = "";
        }}
      />
    </div>
  );
};

export default FileUpload;
