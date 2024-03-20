"use client";

import Dcel from "@/src/DCEL/Dcel";
import { OrthographicView } from "@deck.gl/core/typed";
import { LineLayer, ScatterplotLayer } from "@deck.gl/layers/typed";
import { DeckGL } from "@deck.gl/react/typed";
import { FC } from "react";
import geometry from "@/test/data/shapes/unaligned-deviating-2.json";
import { FeatureCollection } from "geojson";
import HalfEdge from "@/src/DCEL/HalfEdge";

const Canvas: FC = () => {
  const dcel = Dcel.fromGeoJSON(geometry as FeatureCollection);
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
    radiusMaxPixels: 5,
    getRadius: 0.5,
    getFillColor: [0, 0, 0],
  });

  return (
    <DeckGL
      views={new OrthographicView({ flipY: false })}
      layers={[edges, points]}
      initialViewState={{ target: [0, 0], zoom: 5 }}
      controller={true}
    />
  );
};

export default Canvas;
