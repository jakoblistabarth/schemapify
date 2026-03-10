import HalfEdge from "@/src/Dcel/HalfEdge";
import ConfigurationPair from "@/src/c-oriented-schematization/ConfigurationPair";
import Contraction from "@/src/c-oriented-schematization/Contraction";
import Ring from "@/src/geometry/Ring";
import { CompositeLayer, LayersList } from "@deck.gl/core";
import { PathStyleExtension } from "@deck.gl/extensions";
import { LineLayer, PolygonLayer, TextLayer } from "@deck.gl/layers";

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
      new TextLayer(
        this.getSubLayerProps({
          id: "contraction-type-layer",
          data: this.contractions.map(([type, contraction]) => ({
            position: new Ring(contraction.areaPoints).centroid,
            text: type,
          })),
          getColor: [0, 0, 255],
          getSize: 12,
          fontFamily: "Inter Variable",
        }),
      ),
      new PolygonLayer(
        this.getSubLayerProps({
          id: "contraction-area-layer",
          data: this.contractions.map(([, contraction]) => ({
            polygon: contraction.areaPoints.map((d) => d.vector.toArray()),
          })),
          filled: false,
          getLineColor: [0, 0, 255],
          getWidth: 1,
          lineWidthUnits: "pixels",
          extensions: [new PathStyleExtension({ dash: true })],
          getDashArray: [5, 5],
        }),
      ),
      new LineLayer(
        this.getSubLayerProps({
          id: `x-layer`,
          data: this.contractions
            .map(([, contraction]) => contraction.configuration.x)
            .flat(),
          getSourcePosition: (e: HalfEdge) => e.tail.vector.toArray(),
          getTargetPosition: (e: HalfEdge) =>
            e.head?.vector.toArray() ?? [0, 0],
          getColor: [0, 0, 255, 25],
          getWidth: 10,
        }),
      ),
      new LineLayer(
        this.getSubLayerProps({
          id: `inner-edges-layer`,
          data: this.contractions
            .map(([, contraction]) => contraction.configuration.innerEdge)
            .flat(),
          getSourcePosition: (e: HalfEdge) => e.tail.vector.toArray(),
          getTargetPosition: (e: HalfEdge) =>
            e.head?.vector.toArray() ?? [0, 0],
          getColor: [0, 0, 255, 100],
          getWidth: 15,
        }),
      ),
    ];
  }
}
