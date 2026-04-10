import ConfigurationGenerator from "@/src/c-oriented-schematization/ConfigurationGenerator";
import Contraction from "@/src/c-oriented-schematization/Contraction";
import { ContractionType } from "@/src/c-oriented-schematization/ContractionType";
import { LABEL } from "@/src/c-oriented-schematization/CSchematization";
import FaceFaceBoundaryListGenerator from "@/src/c-oriented-schematization/FaceFaceBoundaryListGenerator";
import Staircase from "@/src/c-oriented-schematization/Staircase";
import Dcel from "@/src/Dcel/Dcel";
import HalfEdge from "@/src/Dcel/HalfEdge";
import { Layer, OrthographicView, OrthographicViewState } from "@deck.gl/core";
import { PathStyleExtension } from "@deck.gl/extensions";
import { TripsLayer } from "@deck.gl/geo-layers";
import { PathLayer, PolygonLayer, SolidPolygonLayer } from "@deck.gl/layers";
import DeckGL from "@deck.gl/react";
import "@deck.gl/widgets/stylesheet.css";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import AdaptiveGridLayer from "../helpers/AdaptiveGridLayer";
import ConfigurationLayer from "../helpers/ConfigurationLayer";
import { getInitialZoom } from "../helpers/getInitialZoom";
import useAppStore from "../helpers/store";
import VertexLayer from "../helpers/VertexLayer";
import MapViewWidget, { type ViewMode } from "./MapViewWidget";
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
  const [time, setTime] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("debug");
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

  // Expensive computation — only recomputes when DCEL changes
  const staircaseRegions = activeSnapshot?.additionalData?.regions;
  const snapshotLabel = activeSnapshot?.label;

  const simplePolygonLayer = useMemo(() => {
    const multiPolygons = dcel.toSubdivision().toMultiPolygons();

    // Flatten multiPolygons to individual polygons for PolygonLayer
    // TODO: use the DCEL's feature properties to restore input data
    // dcel.featureProperties
    const polygonData = multiPolygons.flatMap((multiPolygon) =>
      multiPolygon.coordinates.map((polygon, properties) => ({
        polygon,
        properties, // Assuming the first ring is the exterior ring
      })),
    );

    return new PolygonLayer({
      id: "simple-polygons",
      data: polygonData,
      getPolygon: (d: { polygon: Array<Array<[number, number]>> }) => d.polygon,
      getFillColor: [0, 0, 255, 20],
      getLineColor: [0, 0, 255, 255],
      getLineWidth: 1,
      lineWidthUnits: "pixels",
      pickable: true,
      visible: viewMode === "simple",
    });
  }, [dcel, viewMode]);

  const { baseLayers, view } = useMemo(() => {
    const view = new OrthographicView({ flipY: false, id: "ortho" });

    // Always create debug layers but control visibility
    const showDebugLayers =
      viewMode === "debug" &&
      (snapshotLabel === LABEL.SIMPLIFY ||
        snapshotLabel === LABEL.STAIRCASEREGIONS);

    const baseLayers: Layer[] = [gridLayer, simplePolygonLayer];

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

  // Extract hoveredUuid once (dependency on hoverInfo directly would cause layer recomputation)
  const hoveredUuid = hoverInfo?.object?.uuid;

  // Cheap — only hover/animation-sensitive layers recompute on mouse move or tick
  const layers = useMemo((): Layer[] => {
    const halfedges = Array.from(dcel.getHalfEdges());
    const vertices = Array.from(dcel.getVertices());
    const significantVertices =
      activeSnapshot?.additionalData?.significantVertices;

    const isDebugMode = viewMode === "debug";

    const edgeAnimationLayer = new TripsLayer({
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
      visible: isDebugMode,
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
      getWidth: 1,
      widthUnits: "pixels",
      extensions: [new PathStyleExtension({ offset: true })],
      transitions: { getColor: { duration: 300 } },
      visible: isDebugMode,
    });

    const vertexLayer = new VertexLayer({
      id: "vertex-layer",
      data: { vertices, significantVertices },
      hoveredUuid,
      onHover: (info) => setHoverInfo(info),
      visible: isDebugMode,
    });

    return [...baseLayers, edgeLayer, edgeAnimationLayer, vertexLayer];
  }, [activeSnapshot, baseLayers, time, hoveredUuid, dcel, viewMode]);

  return (
    <>
      <DeckGL
        views={view}
        layers={layers}
        initialViewState={initialViewState}
        viewState={viewState}
        onViewStateChange={({ viewState: newViewState }) =>
          setViewState(newViewState as OrthographicViewState)
        }
        controller={true}
      >
        <MapViewWidget
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onZoom={handleZoom}
          isAnimating={isAnimating}
          onAnimatingChange={onAnimatingChange}
        />
      </DeckGL>
      <Tooltip hoverInfo={hoverInfo} activeSnapshot={activeSnapshot} />
    </>
  );
};

export default Canvas;
