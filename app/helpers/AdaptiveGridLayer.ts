import type { DefaultProps } from "@deck.gl/core";
import { Layer } from "@deck.gl/core";
import { ClipSpace } from "@luma.gl/engine";

interface AdaptiveGridLayerProps {
  /**
   * The RGBA color of the dots. Default is black with a rather low opacity).
   */
  dotColor?: [number, number, number, number];
  /** Dot radius in pixels. Default is `1.5`. */
  dotRadiusPx?: number;
  /**
   * Approximate number of grid divisions across the shorter viewport axis.
   * The actual step is rounded to the nearest "nice" value (1 · 10^n, 2 · 10^n, 5 · 10^n).
   * Default is `15`.
   */
  targetGridCount?: number;
}

const defaultProps: DefaultProps<AdaptiveGridLayerProps> = {
  dotColor: { type: "array", value: [0, 0, 0, 75] },
  dotRadiusPx: { type: "number", value: 1.5 },
  targetGridCount: { type: "number", value: 15 },
};

const glslUniformBlock = /* glsl */ `\
uniform adaptiveGridUniforms {
  vec2 worldSpan;
  vec2 gridOffset;
  float gridStep;
  float dotWorldRadius;
  vec4 dotColor;
} adaptiveGrid;
`;

/**
 * Luma.gl v9 shader module that exposes per-draw grid uniforms as a UBO.
 * The name must match the GLSL struct identifier used in the fragment shader.
 */
const adaptiveGridModule = {
  name: "adaptiveGrid",
  vs: glslUniformBlock,
  fs: glslUniformBlock,
  uniformTypes: {
    worldSpan: "vec2<f32>",
    gridOffset: "vec2<f32>",
    gridStep: "f32",
    dotWorldRadius: "f32",
    dotColor: "vec4<f32>",
  },
} as const;

/**
 * ClipSpace provides `in vec2 uv` where (0,0) is the screen bottom-left and
 * (1,1) is the screen top-right (matches NDC → world mapping exactly).
 */
const FRAGMENT_SHADER = /* glsl */ `\
#version 300 es
precision highp float;

in vec2 uv;
out vec4 fragColor;

void main() {
  // Everything here is relative to the viewport's bottom-left corner.
  // Offsets stay small, so the precision stays fine.
  vec2 localPos = adaptiveGrid.worldSpan * uv;

  // Nearest grid point, measured from the first grid line in view.
  vec2 fromFirstLine = localPos - adaptiveGrid.gridOffset;
  vec2 gridPos = round(fromFirstLine / adaptiveGrid.gridStep) * adaptiveGrid.gridStep;
  float dist = length(fromFirstLine - gridPos);

  // Smooth dot edge for antialiasing
  float aa = 1.0 - smoothstep(
    adaptiveGrid.dotWorldRadius * 0.6,
    adaptiveGrid.dotWorldRadius,
    dist
  );

  if (aa <= 0.0) discard;
  fragColor = vec4(adaptiveGrid.dotColor.rgb, adaptiveGrid.dotColor.a * aa);
}
`;

/**
 * Round `rawStep` to the nearest "nice" value on the set { 1, 2, 5 } × 10^n.
 * This produces steps like: 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100 …
 *
 * @param worldSpan - visible world-space span along the shorter viewport axis
 * @param targetCount - desired number of grid divisions
 * @returns nice grid step in world units
 */
export const getGridStep = (worldSpan: number, targetCount: number): number => {
  const rawStep = worldSpan / targetCount;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalised = rawStep / magnitude;
  const niceFactor = normalised < 1.5 ? 1 : normalised < 3.5 ? 2 : 5;
  return niceFactor * magnitude;
};

/**
 * How far the first grid line sits from the viewport's lower edge.
 *
 * Computed here in double precision and passed to the shader.
 * @param min the lower edge of the visible world range, on one axis
 * @param gridStep the spacing between grid lines
 * @returns the offset, in world units, always within `[0, gridStep)`
 */
export const getGridOffset = (min: number, gridStep: number): number =>
  Math.ceil(min / gridStep) * gridStep - min;

/**
 * AdaptiveGridLayer renders a viewport-filling dot grid using a custom GLSL
 * fragment shader running on a clip-space quad.
 *
 * The grid spacing automatically snaps to "nice" world-unit values
 * (1·10^n, 2·10^n, 5·10^n) so dots always land on round coordinates
 * regardless of zoom level.
 */
export default class AdaptiveGridLayer extends Layer<AdaptiveGridLayerProps> {
  static override layerName = "AdaptiveGridLayer";
  static override defaultProps = defaultProps;

  private modelInstance: ClipSpace | null = null;

  override initializeState() {
    const model = new ClipSpace(this.context.device, {
      id: this.props.id,
      fs: FRAGMENT_SHADER,
      modules: [adaptiveGridModule],
      parameters: {
        depthWriteEnabled: false,
        blend: true,
        blendColorOperation: "add",
        blendColorSrcFactor: "src-alpha",
        blendColorDstFactor: "one-minus-src-alpha",
        blendAlphaOperation: "add",
        blendAlphaSrcFactor: "one",
        blendAlphaDstFactor: "zero",
      },
    });
    this.modelInstance = model;
  }

  override finalizeState() {
    this.modelInstance?.destroy();
    this.modelInstance = null;
  }

  override draw() {
    if (!this.modelInstance) return;

    const { viewport } = this.context;
    const { dotColor, dotRadiusPx, targetGridCount } = this.props;

    // Visible world bounds.
    // viewport.unproject uses screen pixels where (0,0) is top-left.
    // Bottom-left corner → world minimum; top-right corner → world maximum.
    const [minX, minY] = viewport.unproject([0, viewport.height]);
    const [maxX, maxY] = viewport.unproject([viewport.width, 0]);

    const worldWidth = maxX - minX;
    const worldHeight = maxY - minY;

    // Choose a "nice" grid step based on the shorter axis so grid density
    // stays reasonable regardless of viewport aspect ratio.
    const gridStep = getGridStep(
      Math.min(worldWidth, worldHeight),
      targetGridCount ?? 15,
    );

    // Convert dot radius from screen pixels to world units.
    const pixelsPerUnit = viewport.width / worldWidth;
    const dotWorldRadius = (dotRadiusPx ?? 1.5) / pixelsPerUnit;

    // Normalize dotColor from 0-255 to 0-1 range for shader
    const normalizedDotColor: [number, number, number, number] = [
      (dotColor?.[0] ?? 0) / 255,
      (dotColor?.[1] ?? 0) / 255,
      (dotColor?.[2] ?? 0) / 255,
      (dotColor?.[3] ?? 38) / 255,
    ];

    const gridOffset: [number, number] = [
      getGridOffset(minX, gridStep),
      getGridOffset(minY, gridStep),
    ];

    this.modelInstance.shaderInputs.setProps({
      adaptiveGrid: {
        worldSpan: [worldWidth, worldHeight],
        gridOffset,
        gridStep,
        dotWorldRadius,
        dotColor: normalizedDotColor,
      },
    });

    this.modelInstance.draw(this.context.renderPass);
  }
}
