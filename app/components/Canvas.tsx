"use client";

import Dcel from "@/src/DCEL/Dcel";
import HalfEdge from "@/src/DCEL/HalfEdge";
import shape from "@/test/data/shapes/unaligned-deviating-2";
import { range } from "d3";
import {
  DeckGL,
  LineLayer,
  OrthographicView,
  OrthographicViewState,
  ScatterplotLayer,
} from "deck.gl";
import { FC } from "react";
import ConfigurationLayer from "../helpers/ConfigurationLayer";
import Vector2D from "@/src/geometry/Vector2D";
import Vertex from "@/src/DCEL/Vertex";

const Canvas: FC = () => {
  const dcel = Dcel.fromMultiPolygons(shape);
  dcel.schematize();

  const configurations =
    dcel.faceFaceBoundaryList?.getMinimalConfigurationPair();
  console.log({ configurations });

  const contractions = new ConfigurationLayer({
    data: configurations?.contraction.configuration,
  });

  const shiftPoint = (edge: HalfEdge, vertex?: Vertex, scale = 0.02) => {
    if (!vertex)
      throw "Error drawing halfEdge: vertex for offset is not defined";
    const shift =
      edge.getVector()?.getNormal(false).getUnitVector().times(scale) ??
      new Vector2D(0, 0);
    return vertex?.toVector().plus(shift).toArray();
  };

  const edges = new LineLayer({
    data: Array.from(dcel.getHalfEdges()),
    getSourcePosition: (e: HalfEdge) => shiftPoint(e, e.tail),
    getTargetPosition: (e: HalfEdge) => shiftPoint(e, e.getHead()),
  });
  const points = new ScatterplotLayer({
    id: "vertices",
    data: Array.from(dcel.getVertices()),
    getPosition: (d) => [d.x, d.y],
    radiusMinPixels: 1,
    radiusMaxPixels: 3,
    stroked: true,
    lineWidthUnits: "pixels",
    lineWidthMinPixels: 1,
    getLineColor: [0, 0, 0],
    getFillColor: [255, 255, 255],
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
    maxZoom: 7,
  };

  return (
    <DeckGL
      views={new OrthographicView({ flipY: false })}
      layers={[grid, edges, contractions, points]}
      initialViewState={initialViewState}
      controller={true}
    />
  );
};

export default Canvas;
