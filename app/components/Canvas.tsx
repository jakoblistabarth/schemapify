"use client";

import Dcel from "@/src/DCEL/Dcel";
import { OrthographicView } from "@deck.gl/core/typed";
import { LineLayer, ScatterplotLayer } from "@deck.gl/layers/typed";
import { DeckGL } from "@deck.gl/react/typed";
import { FC } from "react";
import HalfEdge from "@/src/DCEL/HalfEdge";
import { range } from "d3";
import { TwoPlgnIslandsHoles } from "@/test/data/shapes/2plg-islands-holes";

const Canvas: FC = () => {
  const dcel = Dcel.fromMultiPolygons(TwoPlgnIslandsHoles);
  dcel.schematize();

  const vertices = Array.from(dcel.getVertices());

  const edges = new LineLayer({
    data: Array.from(dcel.getHalfEdges()),
    getSourcePosition: (e: HalfEdge) => e.tail.toVector().toArray(),
    getTargetPosition: (e: HalfEdge) =>
      e.getHead()?.toVector().toArray() ?? [0, 0],
  });
  const points = new ScatterplotLayer({
    data: vertices,
    getPosition: (d) => [d.x, d.y],
    radiusMinPixels: 1,
    radiusMaxPixels: 4,
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
    data: gridPoints,
    getPosition: (d) => d,
    radiusMinPixels: 1,
    radiusMaxPixels: 1,
    getFillColor: [0, 0, 0, 50],
  });

  return (
    <DeckGL
      views={new OrthographicView({ flipY: false })}
      layers={[grid, edges, points]}
      initialViewState={{
        target: dcel.center,
        zoom: 6,
        minZoom: 5,
        maxZoom: 7,
      }}
      controller={true}
    />
  );
};

export default Canvas;
