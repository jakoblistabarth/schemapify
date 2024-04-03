import HalfEdge from "@/src/DCEL/HalfEdge";
import ConfigurationPair from "@/src/c-oriented-schematization/ConfigurationPair";
import Contraction from "@/src/c-oriented-schematization/Contraction";
import {
  CompositeLayer,
  LayersList,
  LineLayer,
  SolidPolygonLayer,
} from "deck.gl";

type LayerData = ConfigurationPair;

type ConfigurationLayerProps = {
  id: string;
  visible: boolean;
  data: LayerData;
};

export default class ConfigurationLayer extends CompositeLayer<ConfigurationLayerProps> {
  static layerName = "ConfigurationLayer";

  get contractions() {
    return Object.entries(this.props.data).filter(
      ([, d]) => d != undefined,
    ) as [string, Contraction][];
  }

  renderLayers(): LayersList | null {
    return [
      new SolidPolygonLayer(
        this.getSubLayerProps({
          id: "contraction-area-layer",
          data: this.contractions.map(([, contraction]) => ({
            polygon: contraction.areaPoints.map((d) => d.toVector().toArray()),
          })),
          getFillColor: (d, { index }) =>
            index > 0 ? [0, 0, 255, 100] : [0, 0, 255, 25],
        }),
      ),
      new LineLayer(
        this.getSubLayerProps({
          id: `x-layer`,
          data: this.contractions
            .map(([, contraction]) => contraction.configuration.getX())
            .flat(),
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
          data: this.contractions
            .map(([, contraction]) => contraction.configuration.innerEdge)
            .flat(),
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
