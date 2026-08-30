import ConfigurationGenerator from "@/src/c-oriented-schematization/ConfigurationGenerator";
import Contraction from "@/src/c-oriented-schematization/Contraction";
import { ContractionType } from "@/src/c-oriented-schematization/ContractionType";
import { LABEL } from "@/src/c-oriented-schematization/CSchematization";
import FaceFaceBoundaryListGenerator from "@/src/c-oriented-schematization/FaceFaceBoundaryListGenerator";
import Staircase from "@/src/c-oriented-schematization/Staircase";
import Dcel from "@/src/Dcel/Dcel";
import HalfEdge from "@/src/Dcel/HalfEdge";
import MultiPolygon from "@/src/geometry/MultiPolygon";
import Polygon from "@/src/geometry/Polygon";
import {
  Layer,
  OrthographicView,
  OrthographicViewState,
  PickingInfo,
} from "@deck.gl/core";
import { PathStyleExtension } from "@deck.gl/extensions";
import { TripsLayer } from "@deck.gl/geo-layers";
import { PathLayer, PolygonLayer, SolidPolygonLayer } from "@deck.gl/layers";
import DeckGL from "@deck.gl/react";
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdaptiveGridLayer from "../helpers/AdaptiveGridLayer";
import ConfigurationLayer from "../helpers/ConfigurationLayer";
import { getInitialZoom } from "../helpers/getInitialZoom";
import useAppStore from "../helpers/store";
import VertexLayer from "../helpers/VertexLayer";
import MapViewWidget from "./MapViewWidget";
import Tooltip, { type HoverInfo } from "./Tooltip";

const step = 0.005;
const intervalMS = 24;
const loopLength = 1;

type Props = {
  dcel: Dcel;
  isAnimating?: boolean;
  onAnimatingChange?: (isAnimating: boolean) => void;
};

const Canvas: FC<Props> = ({
  dcel,
  isAnimating = false,
  onAnimatingChange,
}) => {
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | undefined>(undefined);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [time, setTime] = useState(0);
  const deckglRef = useRef<HTMLDivElement>(null);
  const viewMode = useAppStore((state) => state.viewMode);
  const setViewMode = useAppStore((state) => state.setViewMode);
  const [viewState, setViewState] = useState<OrthographicViewState | undefined>(
    undefined,
  );
  // Workaround to not make layer disappear when switching snapshots
  // Create grid layer once and reuse it across all renders
  // TO-DO: investigate why this happens and if there's a better solution
  const [gridLayer] = useState(
    () => new AdaptiveGridLayer({ id: "adaptive-grid" }),
  );

  const { activeSnapshot } = useAppStore();

  // Extract hoveredUuid once (dependency on hoverInfo directly would cause layer recomputation)
  const hoveredUuid = hoverInfo?.object?.uuid;

  // Compute initial view state early so it's available for handleZoom
  // Memoize to prevent dependency changes on every render
  const initialViewState = useMemo(() => {
    const bbox = dcel.getBbox();
    const initialZoom = getInitialZoom(bbox);
    return {
      target: bbox.center,
      zoom: initialZoom,
    };
  }, [dcel]);

  const handleZoom = useCallback(
    (direction: "in" | "out" | "reset") => {
      const transitionDuration = 500;
      setViewState((prev) => {
        // Initialize from initialViewState if viewState is undefined
        const current = prev || initialViewState;
        if (!current || current.zoom === undefined) return current;

        if (direction === "reset") {
          // Reset to initial zoom
          const bbox = dcel.getBbox();
          const zoom = getInitialZoom(bbox);
          return {
            ...current,
            target: bbox.center,
            zoom,
            transitionDuration,
          };
        }
        const currentZoom =
          typeof current.zoom === "number" ? current.zoom : current.zoom[0];
        return {
          ...current,
          zoom: currentZoom + (direction === "in" ? 1 : -1),
          transitionDuration,
        };
      });
    },
    [dcel, initialViewState],
  );

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

  const handleHover = useCallback((info: PickingInfo | undefined) => {
    if (info) setHoverInfo(info);
    // Initialize cursor position with hover event position to avoid stale tooltip position
    if (info?.object) {
      setCursorPos({ x: info.x, y: info.y });
    } else {
      setCursorPos(null);
    }
  }, []);

  useEffect(() => {
    if (!hoverInfo?.object) return;

    const canvas = deckglRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Get canvas position relative to viewport
      const rect = canvas.getBoundingClientRect();
      setCursorPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    return () => canvas.removeEventListener("mousemove", handleMouseMove);
  }, [hoverInfo?.object]);

  // Expensive computation — only recomputes when DCEL changes
  const staircaseRegions = activeSnapshot?.additionalData?.regions;
  const snapshotLabel = activeSnapshot?.label;

  // Kept out of the layer memo below: converting back to a Subdivision is
  // expensive, and the layer has to be rebuilt whenever the hover changes.
  const simplePolygonData = useMemo(
    () =>
      viewMode !== "simple"
        ? undefined
        : dcel.toSubdivision().multiPolygons.flatMap((multiPolygon, idx) =>
            multiPolygon.polygons.map((polygon) => ({
              multiPolygon,
              polygon,
              uuid: idx.toString(),
            })),
          ),
    [dcel, viewMode],
  );

  const simplePolygonLayer = useMemo(() => {
    if (!simplePolygonData) return undefined;
    return new PolygonLayer({
      id: "simple-polygons",
      data: simplePolygonData,
      getPolygon: (feature: { polygon: Polygon }) =>
        feature.polygon.rings.map((ring) =>
          ring.points.map((point) => point.xy),
        ),
      getFillColor: (feature: { multiPolygon: MultiPolygon }) =>
        feature.multiPolygon.id == hoveredUuid
          ? [0, 0, 255, 40]
          : [0, 0, 255, 20],
      getLineColor: [0, 0, 255, 255],
      getLineWidth: 1,
      lineWidthUnits: "pixels",
      pickable: true,
      onHover: handleHover,
      transitions: {
        getFillColor: { duration: 200 },
      },
    });
  }, [simplePolygonData, hoveredUuid, handleHover]);

  const { baseLayers, view } = useMemo(() => {
    const view = new OrthographicView({ flipY: false, id: "ortho" });

    const showDebugLayers =
      viewMode === "debug" &&
      (snapshotLabel === LABEL.SIMPLIFY ||
        snapshotLabel === LABEL.STAIRCASEREGIONS);

    // `undefined` entries are dropped when the layers are combined below.
    const baseLayers: (Layer | undefined)[] = [gridLayer, simplePolygonLayer];

    if (snapshotLabel === LABEL.STAIRCASEREGIONS && staircaseRegions) {
      const staircaseRegionLayer = new PolygonLayer({
        id: "staircase-regions",
        data: Array.from(staircaseRegions.values()),
        getPolygon: (d: Staircase) =>
          d.region.exteriorRing.points.map((p) => p.xy),
        getFillColor: [0, 0, 255, 20],
        getLineColor: [0, 0, 255, 80],
        getLineWidth: 1,
        lineWidthUnits: "pixels",
        visible: showDebugLayers,
      });
      baseLayers.push(staircaseRegionLayer);
    }

    if (snapshotLabel === LABEL.SIMPLIFY) {
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
        visible: showDebugLayers,
      });

      const ffbList = new FaceFaceBoundaryListGenerator().run(dcel);

      const configurationLayer = new ConfigurationLayer({
        data: ffbList.getMinimalConfigurationPair(configurations),
        visible: showDebugLayers,
      });

      baseLayers.push(configurationLayer);
      baseLayers.push(contractionLayer);
    }

    return {
      baseLayers,
      view,
      initialViewState,
    };
  }, [
    gridLayer,
    dcel,
    snapshotLabel,
    staircaseRegions,
    viewMode,
    initialViewState,
    simplePolygonLayer,
  ]);

  // Static layers (don't depend on animation time)
  const { staticLayers, vertexLayer } = useMemo(() => {
    // debug layers are left out entirely, hiding them only would
    // still cause deck.gl to build attributes and tesselating geometry.
    if (viewMode !== "debug")
      return { staticLayers: baseLayers, vertexLayer: undefined };

    const halfedges = Array.from(dcel.getHalfEdges());
    const vertices = Array.from(dcel.getVertices());
    const significantVertices =
      activeSnapshot?.additionalData?.significantVertices;

    const edgeLayer = new PathLayer({
      id: "edges",
      data: halfedges,
      pickable: true,
      onHover: handleHover,
      getPath: (e: HalfEdge) => [e.tail.xy, e.head!.xy],
      getOffset: 2,
      getColor: (e: HalfEdge) =>
        hoveredUuid === e.uuid ? [150, 150, 255] : [0, 0, 255],
      getWidth: 1,
      widthUnits: "pixels",
      extensions: [new PathStyleExtension({ offset: true })],
      transitions: { getColor: { duration: 300 } },
    });

    const vertexLayer = new VertexLayer({
      id: "vertex-layer",
      data: { vertices, significantVertices },
      hoveredUuid,
      onHover: handleHover,
    });

    return {
      staticLayers: [...baseLayers, edgeLayer],
      vertexLayer,
    };
  }, [baseLayers, handleHover, hoveredUuid, dcel, viewMode, activeSnapshot]);

  // Animation layer (recomputes only when time changes)
  const edgeAnimationLayer = useMemo(() => {
    if (viewMode !== "debug" || !isAnimating) return undefined;
    const halfedges = Array.from(dcel.getHalfEdges());

    return new TripsLayer({
      id: "edges-animated",
      data: halfedges,
      getPath: (e: HalfEdge) => [e.tail.xy, e.head!.xy],
      getOffset: 2,
      getTimestamps: () => [0, 1],
      trailLength: 0.25,
      getColor: [200, 200, 255],
      getWidth: 1,
      widthUnits: "pixels",
      currentTime: time,
      extensions: [new PathStyleExtension({ offset: true })],
    });
  }, [time, dcel, viewMode, isAnimating]);

  // Combine all layers: trips layer before vertex layer
  const layers = useMemo(
    (): Layer[] =>
      [...staticLayers, edgeAnimationLayer, vertexLayer].filter(
        (layer): layer is Layer => layer !== undefined,
      ),
    [staticLayers, edgeAnimationLayer, vertexLayer],
  );

  return (
    <>
      <div ref={deckglRef} className="contents">
        <DeckGL
          views={view}
          layers={layers}
          initialViewState={initialViewState}
          viewState={viewState}
          onViewStateChange={({ viewState: newViewState }) =>
            setViewState(newViewState as OrthographicViewState)
          }
          controller={true}
          getCursor={({ isHovering }) => (isHovering ? "pointer" : "grab")}
        />
      </div>
      <MapViewWidget
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onZoom={handleZoom}
        isAnimating={isAnimating}
        onAnimatingChange={onAnimatingChange}
      />
      <Tooltip
        hoverInfo={hoverInfo}
        activeSnapshot={activeSnapshot}
        cursorPos={cursorPos}
      />
    </>
  );
};

export default Canvas;
