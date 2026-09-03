import type MultiPolygon from "../geometry/MultiPolygon";
import type Subdivision from "../geometry/Subdivision";
import { toWoundRings } from "./rings";

export type SvgOptions = {
  /** Width of the drawing in the SVG's user units, the height follows the data's aspect ratio. */
  size?: number;
  /** Padding around the drawing, in the same units as {@link SvgOptions.size}. */
  padding?: number;
  /** Number of decimals kept per coordinate. */
  precision?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
};

const defaults = {
  size: 1000,
  padding: 10,
  precision: 2,
  fill: "#e5e7eb",
  stroke: "#111827",
  strokeWidth: 1,
} satisfies Required<SvgOptions>;

/** Trim a number to the requested precision, without trailing zeroes. */
const round = (value: number, precision: number) =>
  Number(value.toFixed(precision)).toString();

/** Escape the characters that would break out of an XML attribute. */
const escapeXml = (value: string) =>
  value.replace(
    /[<>&"']/g,
    (character) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[character] as string,
  );

/** Maps a data coordinate into the SVG's user space, flipping y. */
type Project = (position: [number, number]) => [number, number];

/**
 * The path data of one multipolygon: one closed subpath per ring, so that
 * holes are cut out by the `evenodd` fill rule.
 */
const toPathData = (
  multiPolygon: MultiPolygon,
  project: Project,
  precision: number,
) =>
  multiPolygon.polygons
    .flatMap(toWoundRings)
    .map((ring) => {
      // The ring's repeated closing point is left to `Z`.
      const [first, ...rest] = ring.slice(0, -1).map(project);
      const command = ([x, y]: [number, number]) =>
        `${round(x, precision)} ${round(y, precision)}`;
      return `M${command(first)}${rest.map((position) => `L${command(position)}`).join("")}Z`;
    })
    .join("");

/**
 * Draw a {@link Subdivision} as an SVG document, for finishing the
 * schematization in vector software.
 *
 * The coordinates are fitted into the drawing's user space and y is flipped,
 * rather than being left in the data's own units behind a group transform:
 * paths that carry their own coordinates are what vector software expects, and
 * keep the stroke width meaningful.
 * @param subdivision the subdivision to draw
 * @param options overrides for the drawing's size and styling
 * @returns the SVG document as a string
 */
export const subdivisionToSvg = (
  subdivision: Subdivision,
  options: SvgOptions = {},
) => {
  const { size, padding, precision, fill, stroke, strokeWidth } = {
    ...defaults,
    ...options,
  };
  const { xMin, xMax, yMin, yMax } = subdivision.getBbox();
  // Data without extent in one direction would otherwise divide by zero.
  const [dataWidth, dataHeight] = [xMax - xMin || 1, yMax - yMin || 1];
  const scale = size / dataWidth;
  const [width, height] = [
    size + padding * 2,
    dataHeight * scale + padding * 2,
  ];

  const project: Project = ([x, y]) => [
    (x - xMin) * scale + padding,
    // SVG's y axis points down, the data's up.
    (yMax - y) * scale + padding,
  ];

  const paths = subdivision.multiPolygons
    .map((multiPolygon, index) => {
      const id = escapeXml((multiPolygon.id ?? index).toString());
      const data = toPathData(multiPolygon, project, precision);
      return `    <path id="${id}" d="${data}" />`;
    })
    .join("\n");

  const [documentWidth, documentHeight] = [
    round(width, precision),
    round(height, precision),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${documentWidth}" height="${documentHeight}" viewBox="0 0 ${documentWidth} ${documentHeight}">
  <g fill="${fill}" fill-rule="evenodd" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round">
${paths}
  </g>
</svg>
`;
};
