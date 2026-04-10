import { Widget, WidgetPlacement, WidgetProps } from "@deck.gl/core";
import { useWidget } from "@deck.gl/react";
import * as Toolbar from "@radix-ui/react-toolbar";
import { FC, PropsWithChildren, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  RiAddLargeFill,
  RiCollageFill,
  RiCollageLine,
  RiPauseLine,
  RiPlayLine,
  RiResetRightLine,
  RiSubtractLine,
} from "react-icons/ri";

export type ViewMode = "debug" | "simple";

/**
 * Props for the MapViewWidget
 */
export interface MapViewProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onZoom: (direction: "in" | "out" | "reset") => void;
  isAnimating?: boolean;
  onAnimatingChange?: (isAnimating: boolean) => void;
}

/**
 * Widget-specific props extending deck.gl WidgetProps
 */
interface MapViewWidgetProps extends Required<WidgetProps> {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onZoom: (direction: "in" | "out" | "reset") => void;
  isAnimating: boolean;
  onAnimatingChange: (isAnimating: boolean) => void;
  placement: WidgetPlacement;
  element: HTMLDivElement;
}

class MapView extends Widget<MapViewWidgetProps> {
  props: MapViewWidgetProps;
  id: string;
  placement: WidgetPlacement;
  className: string;

  constructor(props: MapViewWidgetProps) {
    super(props);
    this.props = props;
    this.id = props.id;
    this.placement = props.placement;
    this.className = "widget-map-view-switch";
  }

  onAdd(): HTMLDivElement {
    return this.props.element;
  }

  // No dynamic rendering needed since React handles the UI via portals
  onRenderHTML(): void {}
}

const MapViewWidget: FC<
  Omit<MapViewProps, "element" | "id" | "style" | "className" | "_container">
> = (props) => {
  const [showAnimation, setShowAnimation] = useState(
    props.isAnimating ?? false,
  );
  const element = useMemo(() => document.createElement("div"), []);
  useWidget(MapView, {
    ...props,
    element,
    id: "map-view-switch",
    style: {},
    placement: "top-right",
    className: "widget-map-view-switch",
    _container: "",
    isAnimating: props.isAnimating ?? false,
    onAnimatingChange: props.onAnimatingChange ?? (() => {}),
  });
  const [value, setValue] = useState(props.viewMode);

  const handleZoomClick = (direction: "in" | "out" | "reset") => {
    props.onZoom(direction);
  };

  return createPortal(
    <Toolbar.Root
      orientation="vertical"
      className="pointer-events-auto absolute top-3 right-3 rounded-md bg-white p-1 shadow"
    >
      <Toolbar.ToggleGroup
        type="single"
        value={value}
        orientation="vertical"
        onValueChange={(value) => {
          if (value) {
            setValue(value as ViewMode);
            props.onViewModeChange(value as ViewMode);
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
      <div className="space-y-1">
        <ToolbarButton
          ariaLabel="Zoom-in"
          onClick={() => handleZoomClick("in")}
        >
          <RiAddLargeFill />
        </ToolbarButton>
        <ToolbarButton
          ariaLabel="Zoom-out"
          onClick={() => handleZoomClick("out")}
        >
          <RiSubtractLine />
        </ToolbarButton>
        <ToolbarButton
          ariaLabel="Reset zoom"
          onClick={() => handleZoomClick("reset")}
        >
          <RiResetRightLine />
        </ToolbarButton>
      </div>
      <Separator />
      <Toolbar.ToggleGroup
        aria-label="Toggle animation"
        type="single"
        onValueChange={() => {
          const newState = !showAnimation;
          setShowAnimation(newState);
          props.onAnimatingChange?.(newState);
        }}
      >
        <ToggleItem
          value={showAnimation ? "Pause animation" : "Play animation"}
          title={showAnimation ? "Pause animation" : "Play animation"}
        >
          {showAnimation ? <RiPauseLine /> : <RiPlayLine />}
        </ToggleItem>
      </Toolbar.ToggleGroup>
    </Toolbar.Root>,
    element,
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
