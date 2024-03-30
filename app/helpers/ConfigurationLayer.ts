import HalfEdge from "@/src/DCEL/HalfEdge";
import Configuration from "@/src/c-oriented-schematization/Configuration";
import {
  CompositeLayer,
  LayersList,
  LineLayer,
  SolidPolygonLayer,
} from "deck.gl";

type LayerData = Configuration;

type ConfigurationLayerProps = {
  id: string;
  visible: boolean;
  data: LayerData;
};

export default class ConfigurationLayer extends CompositeLayer<ConfigurationLayerProps> {
  static layerName = "ConfigurationLayer";

  renderLayers(): LayersList | null {
    return [
      new SolidPolygonLayer(
        this.getSubLayerProps({
          id: "contraction-area-layer",
          data: this.props.data,
        }),
      ),
      new LineLayer(
        this.getSubLayerProps({
          id: `x-layer`,
          data: this.props.data?.getX(),
          getSourcePosition: (e: HalfEdge) => e.tail.toVector().toArray(),
          getTargetPosition: (e: HalfEdge) =>
            e.getHead()?.toVector().toArray() ?? [0, 0],
          getColor: [0, 0, 255],
          getWidth: 1,
        }),
      ),
      new LineLayer(
        this.getSubLayerProps({
          id: `en-layer`,
          data: [this.props.data?.innerEdge],
          getSourcePosition: (e: HalfEdge) => e.tail.toVector().toArray(),
          getTargetPosition: (e: HalfEdge) =>
            e.getHead()?.toVector().toArray() ?? [0, 0],
          getColor: [0, 0, 255],
          getWidth: 4,
        }),
      ),
    ];
  }
}
