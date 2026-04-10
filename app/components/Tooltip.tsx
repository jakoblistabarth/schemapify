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
        Degree: object.edges.length,
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
  ({ hoverInfo, activeSnapshot }) => {
    // Memoize tooltip content calculation to avoid recomputation on every render
    const tooltipContent = useMemo(() => {
      if (!hoverInfo?.object) return null;
      return getTooltipContent(hoverInfo, activeSnapshot);
    }, [hoverInfo, activeSnapshot]);

    if (!hoverInfo?.object) return null;

    return (
      <div
        className="pointer-events-none absolute rounded bg-white p-3 text-xs shadow-lg"
        style={{ left: hoverInfo.x + 10, top: hoverInfo.y + 10 }}
      >
        <div className="flex gap-2 font-mono">
          <span className="text-gray-400">
            {tooltipContent?.type ?? "Unknown object"}
          </span>
          <span className="font-bold">{hoverInfo?.object?.uuid}</span>
        </div>
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
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if UUID or activeSnapshot changed
    return (
      prevProps.hoverInfo?.object?.uuid === nextProps.hoverInfo?.object?.uuid &&
      prevProps.activeSnapshot === nextProps.activeSnapshot
    );
  },
);

Tooltip.displayName = "Tooltip";

export default Tooltip;
