import ConfigurationPair from "@/src/c-oriented-schematization/ConfigurationPair";
import Contraction from "@/src/c-oriented-schematization/Contraction";
import {
  ConfigurationPurpose,
  ContractionType,
} from "@/src/c-oriented-schematization/ContractionType";
import HalfEdge from "@/src/Dcel/HalfEdge";
import Line from "@/src/geometry/Line";
import Ring from "@/src/geometry/Ring";
import { CompositeLayer, LayersList } from "@deck.gl/core";
import { PathStyleExtension } from "@deck.gl/extensions";
import {
  LineLayer,
  PathLayer,
  PolygonLayer,
  ScatterplotLayer,
  TextLayer,
} from "@deck.gl/layers";

type LayerData = ConfigurationPair;

type ConfigurationLayerProps = {
  id: string;
  visible: boolean;
  data: LayerData;
};

export default class ConfigurationLayer extends CompositeLayer<ConfigurationLayerProps> {
  static layerName = "ConfigurationLayer";

  get pair() {
    return this.props.data;
  }

  get contractions() {
    return Object.entries(this.props.data).filter(
      ([, d]) => d != undefined,
    ) as [ConfigurationPurpose, Contraction][];
  }

  get configurationPair() {
    return this.props.data;
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
          getSize: 10,
          fontFamily: "Inter Variable",
        }),
      ),
      new ScatterplotLayer(
        this.getSubLayerProps({
          id: "contraction-point-layer",
          data: this.contractions.map(([, contraction]) => ({
            position: contraction.point.xy,
            type: contraction.type,
          })),
          radiusMaxPixels: 8,
          getFillColor: (d: {
            position: [number, number];
            type: ContractionType;
          }) => {
            return d.type === ContractionType.P ? [0, 255, 0] : [255, 0, 0];
          },
        }),
      ),
      new ScatterplotLayer(
        this.getSubLayerProps({
          id: "compensation-point-layer",
          data: (() => {
            if (
              !this.configurationPair ||
              !(this.configurationPair instanceof ConfigurationPair)
            )
              return [];
            const endpoints =
              this.configurationPair.getNewCompensationPositions();
            if (!endpoints) return [];
            return endpoints.filter(Boolean).map((p) => ({
              position: p?.xy,
            }));
          })(),
          radiusMaxPixels: 8,
          getFillColor: [255, 0, 255],
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
      new PathLayer(
        this.getSubLayerProps({
          id: `x-layer`,
          data: this.contractions
            .map(([, contraction]) => contraction.configuration.x)
            .flat(),
          getPath: (e: HalfEdge) => [e.tail.xy, e.head?.xy ?? [0, 0]],
          getColor: [0, 0, 255, 25],
          getWidth: 15,
          widthUnits: "pixels",
          capRounded: true,
        }),
      ),
      new PathLayer(
        this.getSubLayerProps({
          id: `inner-edges-layer`,
          data: this.contractions
            .map(([, contraction]) => contraction.configuration.innerEdge)
            .flat(),
          getPath: (e: HalfEdge) => [e.tail.xy, e.head?.xy ?? [0, 0]],
          getColor: [0, 0, 255, 75],
          getWidth: 15,
          widthUnits: "pixels",
          capRounded: true,
        }),
      ),
      new LineLayer(
        this.getSubLayerProps({
          id: `track-layer`,
          data: this.contractions
            .map(([, contraction]) => contraction.configuration.tracks)
            .flat(),
          getSourcePosition: (l: Line) => l.getPointOnLine(-1e4).xy,
          getTargetPosition: (l: Line) => l.getPointOnLine(1e4).xy,
          getColor: [0, 0, 255, 10],
          getWidth: 2,
          widthUnits: "pixels",
        }),
      ),
      this.pair instanceof ConfigurationPair &&
      this.pair.shouldUseSharedEdgeMove()
        ? new ScatterplotLayer(
            this.getSubLayerProps({
              id: "meeting-point-layer",
              data: [
                { position: this.pair.getMeetingPoint()?.meetingPoint.xy },
              ],
              getRadius: 12,
              radiusUnits: "pixels",
              getLineColor: [0, 0, 255],
              filled: false,
              stroked: true,
              getLineWidth: 1,
              lineWidthUnits: "pixels",
            }),
          )
        : null,
    ];
  }
}
