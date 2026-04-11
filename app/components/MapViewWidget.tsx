import * as Toolbar from "@radix-ui/react-toolbar";
import { FC, PropsWithChildren } from "react";
import {
  RiAddLargeFill,
  RiCollageFill,
  RiCollageLine,
  RiFlag2Line,
  RiPauseLine,
  RiPlayLine,
  RiSubtractLine,
} from "react-icons/ri";
import { ViewMode } from "../helpers/store";

export interface MapViewProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onZoom: (direction: "in" | "out" | "reset") => void;
  isAnimating?: boolean;
  onAnimatingChange?: (isAnimating: boolean) => void;
}

const MapViewWidget: FC<MapViewProps> = ({
  viewMode,
  onViewModeChange,
  onZoom,
  isAnimating,
  onAnimatingChange,
}) => {
  const isViewMode = (value: string): value is ViewMode => {
    return value === "debug" || value === "simple";
  };

  return (
    <Toolbar.Root
      orientation="vertical"
      className="pointer-events-auto absolute top-3 right-3 z-10 rounded-md bg-white p-1 shadow"
    >
      <Toolbar.ToggleGroup
        type="single"
        value={viewMode}
        orientation="vertical"
        onValueChange={(value) => {
          if (isViewMode(value)) {
            onViewModeChange(value);
          }
        }}
      >
        <ToggleItem
          value="debug"
          title="Show debug view with configuration layers"
        >
          <RiCollageLine />
        </ToggleItem>
        <ToggleItem value="simple" title="Show simple polygon view">
          <RiCollageFill />
        </ToggleItem>
      </Toolbar.ToggleGroup>
      <Separator />
      <div className="flex flex-col space-y-1">
        <ToolbarButton ariaLabel="Zoom-in" onClick={() => onZoom("in")}>
          <RiAddLargeFill />
        </ToolbarButton>
        <ToolbarButton ariaLabel="Zoom-out" onClick={() => onZoom("out")}>
          <RiSubtractLine />
        </ToolbarButton>
        <ToolbarButton ariaLabel="Reset zoom" onClick={() => onZoom("reset")}>
          <RiFlag2Line />
        </ToolbarButton>
      </div>
      <Separator />
      <Toolbar.ToggleGroup
        aria-label="Toggle animation"
        type="single"
        value={isAnimating ? "play" : ""}
        onValueChange={() => {
          onAnimatingChange?.(!(isAnimating ?? false));
        }}
      >
        <ToggleItem
          value="play"
          title={isAnimating ? "Pause animation" : "Play animation"}
        >
          {isAnimating ? <RiPauseLine /> : <RiPlayLine />}
        </ToggleItem>
      </Toolbar.ToggleGroup>
    </Toolbar.Root>
  );
};

const ToggleItem: FC<
  PropsWithChildren<{
    value: string;
    title: string;
  }>
> = ({ value, title, children }) => {
  return (
    <Toolbar.ToggleItem
      value={value}
      title={title}
      className="flex size-8 items-center justify-center bg-white leading-4 first:rounded-t last:rounded-b hover:bg-blue-50 focus:z-10 focus:shadow-[0_0_0_2px] focus:shadow-black focus:outline-none data-[state=on]:bg-blue-100 data-[state=on]:text-blue-600"
    >
      {children}
    </Toolbar.ToggleItem>
  );
};

const ToolbarButton: FC<
  PropsWithChildren<{
    ariaLabel: string;
    onClick?: () => void;
  }>
> = ({ ariaLabel, onClick, children }) => {
  return (
    <Toolbar.ToolbarButton
      className="inline-flex size-8 items-center justify-center rounded bg-white hover:bg-blue-50 focus:z-10 focus:shadow-[0_0_0_2px] focus:shadow-black focus:outline-none"
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {children}
    </Toolbar.ToolbarButton>
  );
};

const Separator: FC = () => {
  return <Toolbar.Separator className="my-1 h-px bg-blue-100" />;
};

export default MapViewWidget;
