import Dcel from "@/src/Dcel/Dcel";
import HalfEdge from "@/src/Dcel/HalfEdge";
import Vertex from "@/src/Dcel/Vertex";
import Vector2D from "@/src/geometry/Vector2D";
import { range } from "d3";
import {
  DeckGL,
  LineLayer,
  OrthographicView,
  OrthographicViewState,
  PickingInfo,
  ScatterplotLayer,
  SolidPolygonLayer,
  TripsLayer,
} from "deck.gl";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import ConfigurationLayer from "../helpers/ConfigurationLayer";
import Contraction from "@/src/c-oriented-schematization/Contraction";
import { ContractionType } from "@/src/c-oriented-schematization/ContractionType";

const step = 0.005;
const intervalMS = 24;
const loopLength = 1;

type Props = {
  dcel: Dcel;
  isAnimating?: boolean;
};

type HoverInfo = PickingInfo<Vertex | HalfEdge>;

const Canvas: FC<Props> = ({ dcel, isAnimating = false }) => {
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | undefined>(undefined);
  const [time, setTime] = useState(0);

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

  const shiftPoint = useCallback(
    (edge: HalfEdge, vertex?: Vertex, scale = 0.02) => {
      if (!vertex)
        throw "Error drawing halfEdge: vertex for offset is not defined";
      const shift =
        edge.getVector()?.getNormal(true).unitVector.times(scale) ??
        new Vector2D(0, 0);
      return vertex?.vector.plus(shift).toArray();
    },
    [],
  );

  const getShiftedPath = useCallback(
    (edge: HalfEdge) => {
      return [edge.tail, edge.head].map((p, idx) => {
        return { coordinates: shiftPoint(edge, p), timestamp: idx };
      });
    },
    [shiftPoint],
  );

  const { layers, view, initialViewState } = useMemo(() => {
    const halfedges = Array.from(dcel.getHalfEdges());
    const vertices = Array.from(dcel.getVertices());
    const gridPoints = range(-50, 50, 0.5)
      .map((i) => range(-50, 50, 0.5).map((j) => [i, j]))
      .flat();

    const edges = new LineLayer({
      id: "edges",
      data: halfedges,
      getSourcePosition: (e: HalfEdge) => shiftPoint(e, e.tail),
      getTargetPosition: (e: HalfEdge) => shiftPoint(e, e.head),
      pickable: true,
      onHover: (info) => setHoverInfo(info),
      getWidth: (e: HalfEdge) => (hoverInfo?.object?.uuid === e.uuid ? 5 : 1),
      getColor: [0, 0, 255],
      widthMinPixels: 2,
      transitions: {
        getWidth: {
          duration: 100,
        },
      },
    });

    const contractions = new SolidPolygonLayer({
      id: "contractions",
      data: dcel
        .getContractions()
        .filter((c) => c.configuration.innerEdge.face?.edge)
        .filter((c) => c.isFeasible)
        // .filter((c) => c.type === ContractionType.N)
        .map((c) => ({
          polygon: c.areaPoints.map((p) => p.vector.toArray()),
          type: c.type,
        })),
      getFillColor: (c: Contraction) =>
        c.type === ContractionType.N ? [255, 0, 0, 10] : [0, 255, 0, 10],
    });

    const edgesAnimated = new TripsLayer({
      id: "edges-animated",
      data: halfedges,
      getPath: (e: HalfEdge) => getShiftedPath(e).map((e) => e.coordinates),
      getTimestamps: (e: HalfEdge) => getShiftedPath(e).map((e) => e.timestamp),
      trailLength: 0.25,
      getColor: [200, 200, 255],
      widthMinPixels: 2,
      widthMaxPixels: 2,
      currentTime: time,
    });

    const points = new ScatterplotLayer({
      id: "vertices",
      pickable: true,
      data: vertices,
      getPosition: (d) => [d.x, d.y],
      radiusMinPixels: 1,
      radiusMaxPixels: 5,
      onHover: (info) => setHoverInfo(info),
      stroked: true,
      lineWidthUnits: "pixels",
      lineWidthMinPixels: 1,
      getLineColor: [0, 0, 0],
      getLineWidth: (d) => (hoverInfo?.object?.uuid === d.uuid ? 3 : 1),
      getFillColor: (d) =>
        hoverInfo?.object?.uuid === d.uuid ? [0, 255, 0] : [255, 255, 255],
    });

    const grid = new ScatterplotLayer({
      id: "grid",
      data: gridPoints,
      getPosition: (d) => d,
      radiusMinPixels: 1,
      radiusMaxPixels: 1,
      getFillColor: [0, 0, 0, 50],
    });

    const configurations = new ConfigurationLayer({
      data: dcel.faceFaceBoundaryList?.getMinimalConfigurationPair(),
    });

    const layers = [
      grid,
      configurations,
      contractions,
      edges,
      edgesAnimated,
      points,
    ];

    const initialViewState: OrthographicViewState = {
      target: dcel.center,
      zoom: 6,
      minZoom: 5,
      maxZoom: 10,
    };

    const view = new OrthographicView({ flipY: false });

    return {
      layers,
      view,
      initialViewState,
    };
  }, [getShiftedPath, hoverInfo, shiftPoint, time, dcel]);

  return (
    <>
      <DeckGL
        views={view}
        layers={layers}
        initialViewState={initialViewState}
        controller={true}
      />
      {hoverInfo?.object && (
        <div
          className="pointer-events-none absolute rounded bg-white p-3 shadow-lg"
          style={{ left: hoverInfo.x + 10, top: hoverInfo.y + 10 }}
        >
          {hoverInfo?.object?.uuid}
          <br />
          {hoverInfo?.object?.toString()}
        </div>
      )}
    </>
  );
};

export default Canvas;
