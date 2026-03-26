import ConfigurationGenerator from "@/src/c-oriented-schematization/ConfigurationGenerator";
import Contraction from "@/src/c-oriented-schematization/Contraction";
import { ContractionType } from "@/src/c-oriented-schematization/ContractionType";
import { LABEL } from "@/src/c-oriented-schematization/CSchematization";
import FaceFaceBoundaryListGenerator from "@/src/c-oriented-schematization/FaceFaceBoundaryListGenerator";
import Dcel from "@/src/Dcel/Dcel";
import HalfEdge from "@/src/Dcel/HalfEdge";
import Vertex from "@/src/Dcel/Vertex";
import Snapshot from "@/src/Snapshot/Snapshot";
import {
  OrthographicView,
  OrthographicViewState,
  PickingInfo,
} from "@deck.gl/core";
import { PathStyleExtension } from "@deck.gl/extensions";
import { TripsLayer } from "@deck.gl/geo-layers";
import { PathLayer, SolidPolygonLayer } from "@deck.gl/layers";
import DeckGL from "@deck.gl/react";
import { ZoomWidget } from "@deck.gl/widgets";
import "@deck.gl/widgets/stylesheet.css";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import AdaptiveGridLayer from "../helpers/AdaptiveGridLayer";
import ConfigurationLayer from "../helpers/ConfigurationLayer";
import { getInitialZoom } from "../helpers/getInitialZoom";
import useAppStore from "../helpers/store";
import VertexLayer from "../helpers/VertexLayer";

const step = 0.005;
const intervalMS = 24;
const loopLength = 1;

type Props = {
  dcel: Dcel;
  isAnimating?: boolean;
};

export type HoverInfo = PickingInfo<Vertex | HalfEdge>;

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
  } else if (object instanceof HalfEdge) {
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
};

const Canvas: FC<Props> = ({ dcel, isAnimating = false }) => {
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | undefined>(undefined);
  const [time, setTime] = useState(0);
  // TODO: investigate why this happens and if there's a better solution
  // Workaround to not make layer disappear when switching snapshots
  // Create grid layer once and reuse it across all renders
  const [gridLayer] = useState(
    () => new AdaptiveGridLayer({ id: "adaptive-grid" }),
  );

  const { activeSnapshot } = useAppStore();

  const animate = useCallback(() => {
    // increment time by "step" on each loop
    if (!isAnimating) return;
    setTime((t) => (t + step) % loopLength);
  }, [isAnimating]);

  useEffect(() => {
    // start loop
    const currentInterval = setInterval(animate, intervalMS);
    return () => clearInterval(currentInterval);
  }, [animate]);

  // Expensive computation — only recomputes when DCEL changes
  const { baseLayers, view, initialViewState } = useMemo(() => {
    // Auto-fit DCEL with log2 zoom for DeckGL
    const bbox = dcel.getBbox();
    const zoom = getInitialZoom(bbox);

    const initialViewState: OrthographicViewState = {
      target: bbox.center,
      zoom,
    };

    const view = new OrthographicView({ flipY: false, id: "ortho" });

    if (activeSnapshot?.label !== LABEL.SIMPLIFY)
      return { baseLayers: [gridLayer], view, initialViewState };

    const configurations = new ConfigurationGenerator().run(dcel);

    const contractionLayer = new SolidPolygonLayer({
      id: "contractions",
      data: [...configurations.values()]
        .flatMap((c) => Object.values(c.contractions))
        .filter((c) => c?.configuration.innerEdge.face?.edge)
        .filter((c) => c?.isFeasible)
        .map((c) => ({
          polygon: c?.areaPoints.map((p) => p.vector.toArray()),
          type: c?.type,
        })),
      getFillColor: (c: Contraction) =>
        c.type === ContractionType.N ? [255, 0, 0, 10] : [0, 255, 0, 10],
    });

    const ffbList = new FaceFaceBoundaryListGenerator().run(dcel);

    const configurationLayer = new ConfigurationLayer({
      data: ffbList.getMinimalConfigurationPair(configurations),
    });

    return {
      baseLayers: [gridLayer, configurationLayer, contractionLayer],
      view,
      initialViewState,
    };
  }, [gridLayer, dcel, activeSnapshot?.label]);

  // Cheap — only hover/animation-sensitive layers recompute on mouse move or tick
  const layers = useMemo(() => {
    const halfedges = Array.from(dcel.getHalfEdges());
    const vertices = Array.from(dcel.getVertices());
    const significantVertices =
      activeSnapshot?.additionalData?.significantVertices;
    const hoveredUuid = hoverInfo?.object?.uuid;

    const edgeAnimationLayer = new TripsLayer({
      id: "edges-animated",
      data: halfedges,
      getPath: (e: HalfEdge) => [e.tail.xy, e.head!.xy],
      getOffset: 2,
      getTimestamps: () => [0, 1],
      trailLength: 0.25,
      getColor: [200, 200, 255],
      widthMinPixels: 2,
      widthMaxPixels: 2,
      currentTime: time,
      extensions: [new PathStyleExtension({ offset: true })],
    });

    const edgeLayer = new PathLayer({
      id: "edges",
      data: halfedges,
      pickable: true,
      onHover: (info) => setHoverInfo(info),
      getPath: (e: HalfEdge) => [e.tail.xy, e.head!.xy],
      getOffset: 2,
      getColor: (e: HalfEdge) =>
        hoveredUuid === e.uuid ? [150, 150, 255] : [0, 0, 255],
      widthMinPixels: 2,
      widthUnits: "pixels",
      extensions: [new PathStyleExtension({ offset: true })],
      transitions: { getColor: { duration: 300 } },
    });

    const vertexLayer = new VertexLayer({
      id: "vertex-layer",
      data: { vertices, significantVertices },
      hoveredUuid,
      onHover: (info) => setHoverInfo(info),
    });

    return [...baseLayers, edgeLayer, edgeAnimationLayer, vertexLayer];
  }, [activeSnapshot, baseLayers, hoverInfo, time, dcel]);

  const tooltipContent = useMemo(() => {
    if (!hoverInfo) return null;
    return getTooltipContent(hoverInfo, activeSnapshot);
  }, [hoverInfo, activeSnapshot]);

  const widgets = useMemo(
    () => [new ZoomWidget({ placement: "top-right" })],
    [],
  );

  return (
    <>
      <DeckGL
        views={view}
        layers={layers}
        initialViewState={initialViewState}
        controller={true}
        widgets={widgets}
      />
      {hoverInfo?.object && (
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
      )}
    </>
  );
};

export default Canvas;
