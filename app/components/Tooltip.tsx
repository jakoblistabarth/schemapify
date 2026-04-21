import { LABEL } from "@/src/c-oriented-schematization/CSchematization";
import HalfEdge from "@/src/Dcel/HalfEdge";
import Vertex from "@/src/Dcel/Vertex";
import MultiPolygon from "@/src/geometry/MultiPolygon";
import Snapshot from "@/src/Snapshot/Snapshot";
import { PickingInfo } from "@deck.gl/core";
import { FC, memo, useMemo } from "react";

export type HoverInfo = PickingInfo<
  Vertex | HalfEdge | { multiPolygon: MultiPolygon; uuid: string }
>;

interface TooltipProps {
  hoverInfo: HoverInfo | undefined;
  activeSnapshot?: Snapshot;
  cursorPos?: { x: number; y: number } | null;
}

const getTooltipContent = (hoverInfo: HoverInfo, activeSnapshot?: Snapshot) => {
  const { object } = hoverInfo;
  if (object instanceof Vertex) {
    const additionalData = activeSnapshot?.additionalData;
    const significantVertices =
      additionalData?.significantVertices &&
      activeSnapshot?.label === LABEL.CLASSIFY
        ? additionalData.significantVertices
        : undefined;
    const isSignificant =
      significantVertices?.get(Vertex.getKey(object.x, object.y)) ?? false;
    return {
      type: "Vertex",
      metadata: {
        Coordinates: object.xy.join("·"),
        Degree: object.degree,
        Significant: isSignificant,
      },
    };
  }
  if (object instanceof HalfEdge) {
    const additionalData = activeSnapshot?.additionalData;
    const coordKey = object.coordKey;
    const dataForObject =
      additionalData?.halfEdgeClasses &&
      activeSnapshot?.label === LABEL.CLASSIFY &&
      coordKey !== undefined
        ? additionalData.halfEdgeClasses.get(coordKey)
        : {};
    return {
      type: "HalfEdge",
      metadata: {
        Tail: object.tail.xy.join("·"),
        Head: object.head?.xy.join("·"),
        ...dataForObject,
      },
    };
  }
  if (object?.multiPolygon instanceof MultiPolygon) {
    return {
      type: "Polygon",
      metadata: {
        ...object.multiPolygon.properties,
      },
    };
  }
};

const Tooltip: FC<TooltipProps> = memo(
  ({ hoverInfo, activeSnapshot, cursorPos }) => {
    // Memoize tooltip content calculation to avoid recomputation on every render
    const tooltipContent = useMemo(() => {
      if (!hoverInfo?.object) return null;
      return getTooltipContent(hoverInfo, activeSnapshot);
    }, [hoverInfo, activeSnapshot]);

    if (!hoverInfo?.object) return null;

    return (
      <div
        className="pointer-events-none fixed rounded bg-white text-xs shadow-lg"
        style={{
          left: (cursorPos?.x ?? hoverInfo.x) + 10,
          top: (cursorPos?.y ?? hoverInfo.y) + 10,
        }}
      >
        <div className="flex gap-2 border-b border-l-2 border-b-blue-50 border-l-blue-500 p-2 font-mono">
          <span>{tooltipContent?.type ?? "Unknown object"}</span>
          <span className="font-bold">{hoverInfo?.object?.uuid}</span>
        </div>
        <div className="p-2">
          <table>
            <tbody>
              {tooltipContent &&
                Object.entries(tooltipContent.metadata).map(([key, value]) => (
                  <tr key={key}>
                    <td className="pr-2">{key}</td>
                    <td className="font-mono">{String(value)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Only skip re-render if UUID, activeSnapshot, and cursorPos are all the same
    return (
      prevProps.hoverInfo?.object?.uuid === nextProps.hoverInfo?.object?.uuid &&
      prevProps.activeSnapshot === nextProps.activeSnapshot &&
      prevProps.cursorPos?.x === nextProps.cursorPos?.x &&
      prevProps.cursorPos?.y === nextProps.cursorPos?.y
    );
  },
);

Tooltip.displayName = "Tooltip";

export default Tooltip;
