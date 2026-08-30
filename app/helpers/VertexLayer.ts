import Vertex from "@/src/Dcel/Vertex";
import { CompositeLayer, LayersList } from "@deck.gl/core";
import { ScatterplotLayer } from "@deck.gl/layers";
import { HoverInfo } from "../components/Tooltip";

type LayerData = {
  vertices: Vertex[];
  significantVertices?: Map<string | number, boolean>;
};

type VertexLayerProps = {
  id: string;
  data: LayerData;
  hoveredUuid?: string;
  onHover?: (info: HoverInfo | undefined) => void;
};

export default class VertexLayer extends CompositeLayer<VertexLayerProps> {
  static layerName = "VertexLayer";

  get vertices() {
    return this.props.data.vertices;
  }

  renderLayers(): LayersList | null {
    const { hoveredUuid, onHover } = this.props;

    return [
      new ScatterplotLayer({
        id: `${this.props.id}-scatter`,
        pickable: true,
        data: this.vertices,
        getPosition: (d) => {
          return [d.x, d.y];
        },
        radiusMinPixels: 4,
        radiusUnits: "pixels",
        getRadius: (d) => (hoveredUuid === d.uuid ? 6 : 4),
        onHover,
        stroked: true,
        lineWidthUnits: "pixels",
        lineWidthMinPixels: 1,
        getLineWidth: 1,
        getFillColor: [255, 255, 255],
        transitions: {
          getRadius: { duration: 150 },
          getLineWidth: { duration: 100 },
        },
      }),
      new ScatterplotLayer({
        id: `${this.props.id}-significant`,
        data: this.vertices.filter((v) => {
          const key = Vertex.getKey(v.x, v.y);
          return this.props.data.significantVertices?.get(key);
        }),
        getPosition: (d) => {
          return [d.x, d.y];
        },
        radiusMinPixels: 1,
        radiusUnits: "pixels",
        getRadius: 1,
        getFillColor: [0, 0, 255],
        transitions: {
          getRadius: { duration: 150 },
          getLineWidth: { duration: 100 },
        },
      }),
    ];
  }
}
