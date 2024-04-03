"use client";

import Dcel from "@/src/DCEL/Dcel";
import HalfEdge from "@/src/DCEL/HalfEdge";
import Vertex from "@/src/DCEL/Vertex";
import MultiPolygon from "@/src/geometry/MultiPolygon";
import Vector2D from "@/src/geometry/Vector2D";
import { range } from "d3";
import {
  DeckGL,
  LineLayer,
  OrthographicView,
  OrthographicViewState,
  ScatterplotLayer,
  TripsLayer,
} from "deck.gl";
import { FC, useEffect, useMemo, useState } from "react";
import ConfigurationLayer from "../helpers/ConfigurationLayer";

const step = 0.005;
const intervalMS = 24;
const loopLength = 1;

const Canvas: FC = () => {
  const { dcel } = useMemo(() => {
    const dcel = Dcel.fromMultiPolygons([
      MultiPolygon.fromCoordinates([
        [
          [
            [-3, 3],
            [0, -2],
            [3, 2],
          ],
        ],
      ]),
    ]);
    dcel.schematize();
    return { dcel };
  }, []);

  const [hoverInfo, setHoverInfo] = useState<HoverInfo | undefined>(undefined);
  const [time, setTime] = useState(0);

  const animate = () => {
    // increment time by "step" on each loop
    setTime((t) => (t + step) % loopLength);
  };

  useEffect(() => {
    // start loop
    const currentInterval = setInterval(animate, intervalMS);

    return () => clearInterval(currentInterval);
  }, []);

  const configurationPair =
    dcel.faceFaceBoundaryList?.getMinimalConfigurationPair();

  const configurations = new ConfigurationLayer({
    data: configurationPair,
  });
  // console.log({ configurationPair });
  // console.log(
  //   configurationPair &&
  //     Object.entries(configurationPair).map(([k, d]) => [
  //       k,
  //       d.type,
  //       d.configuration.innerEdge.uuid,
  //     ]),
  // );

  const shiftPoint = (edge: HalfEdge, vertex?: Vertex, scale = 0.02) => {
    if (!vertex)
      throw "Error drawing halfEdge: vertex for offset is not defined";
    const shift =
      edge.getVector()?.getNormal(true).getUnitVector().times(scale) ??
      new Vector2D(0, 0);
    return vertex?.toVector().plus(shift).toArray();
  };

  const getShiftedPath = (edge: HalfEdge) => {
    return [edge.tail, edge.getHead()].map((p, idx) => {
      return { coordinates: shiftPoint(edge, p), timestamp: idx };
    });
  };

  const edges = new LineLayer({
    id: "edges",
    data: Array.from(dcel.getHalfEdges()),
    getSourcePosition: (e: HalfEdge) => shiftPoint(e, e.tail),
    getTargetPosition: (e: HalfEdge) => shiftPoint(e, e.getHead()),
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

  const edgesAnimated = new TripsLayer({
    id: "edges-animated",
    data: Array.from(dcel.getHalfEdges()),
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
    data: Array.from(dcel.getVertices()),
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

  const gridPoints = range(-50, 50, 0.5)
    .map((i) => range(-50, 50, 0.5).map((j) => [i, j]))
    .flat();

  const grid = new ScatterplotLayer({
    id: "grid",
    data: gridPoints,
    getPosition: (d) => d,
    radiusMinPixels: 1,
    radiusMaxPixels: 1,
    getFillColor: [0, 0, 0, 50],
  });

  const initialViewState: OrthographicViewState = {
    target: dcel.center,
    zoom: 6,
    minZoom: 5,
    maxZoom: 10,
  };

  return (
    <>
      <DeckGL
        views={new OrthographicView({ flipY: false })}
        layers={[grid, configurations, edges, edgesAnimated, points]}
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
