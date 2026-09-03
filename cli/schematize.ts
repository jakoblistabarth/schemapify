import {
  createC,
  parseAngles,
  type CConfig,
} from "@/src/c-oriented-schematization/CConfig";
import CSchematization from "@/src/c-oriented-schematization/CSchematization";
import { style as defaultStyle } from "@/src/c-oriented-schematization/schematization.style";
import { formatCrs } from "@/src/Input/Crs";
import { readGeoData } from "@/src/Input/readGeoData";
import {
  canExportGeoJson,
  outputFormatOf,
  serializeSubdivision,
} from "@/src/Output";
import { degreesToRadians, formatInteger } from "@/src/utilities";
import { Command, InvalidArgumentError, Option } from "commander";
import { readFile, writeFile } from "fs/promises";
import { basename, extname } from "path";

/** Thrown for anything the user can fix; reported without a stack trace. */
class UserError extends Error {}

/**
 * Read a numeric option, for commander's `argParser`.
 * @param value the raw argument
 * @returns the parsed number
 */
const toNumber = (value: string) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed))
    throw new InvalidArgumentError("Expected a number.");
  return parsed;
};

/**
 * Read the orientations of an irregular C, for commander's `argParser`.
 * @param value the raw argument
 * @returns the angles in radians
 */
const toAngles = (value: string) => {
  try {
    return parseAngles(value);
  } catch (error) {
    throw new InvalidArgumentError(
      error instanceof Error ? error.message : "Expected degrees.",
    );
  }
};

/** The parsed command line, as commander hands it to the action. */
type Options = {
  output?: string;
  orientations: number;
  beta: number;
  angles?: number[];
  k: number;
  lambda?: number;
  maxIterations?: number;
  layer: string;
  quiet: boolean;
};

const program = new Command()
  .name("schematize")
  .description(
    "Schematize a polygonal subdivision, as the web app does but headlessly.",
  )
  .argument("<input>", "geodata to schematize: .gpkg, .fgb or .geojson")
  .option(
    "-o, --output <path>",
    "output file, format taken from its extension (.gpkg, .fgb, .geojson, .svg); defaults to <input>-schematized.gpkg",
  )
  .option(
    "-c, --orientations <n>",
    "orientations of a regular C",
    toNumber,
    defaultStyle.c.orientations,
  )
  .option("-b, --beta <deg>", "rotation of C, in degrees", toNumber, 0)
  .addOption(
    new Option(
      "--angles <degrees>",
      "comma-separated orientations of an irregular C, each completed with its opposite",
    )
      .argParser(toAngles)
      .conflicts(["orientations", "beta"]),
  )
  .option("-k, --k <n>", "target number of edges", toNumber, defaultStyle.k)
  .option(
    "--lambda <n>",
    "subdivide edges longer than diameter × lambda",
    toNumber,
  )
  .option(
    "--max-iterations <n>",
    "cap on the simplification's edge moves",
    toNumber,
  )
  .option("--layer <name>", "GeoPackage layer name", "schematization")
  .option("-q, --quiet", "only report errors", false);

const main = async (inputPath: string, options: Options) => {
  const outputPath =
    options.output ??
    `${basename(inputPath, extname(inputPath))}-schematized.gpkg`;

  const cConfig: CConfig = options.angles
    ? { type: "irregular", angles: options.angles }
    : {
        type: "regular",
        orientations: options.orientations,
        beta: degreesToRadians(options.beta),
      };
  // Built up front, both to report an unusable C before anything is read and to
  // report it as the option error it is rather than as a failed run.
  let c;
  try {
    c = createC(cConfig);
  } catch (error) {
    throw new UserError(
      `Cannot build C: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const log = options.quiet
    ? () => {}
    : (message: string) => console.error(message);

  // No `maxVertexCount`: the browser needs a limit to stay responsive, a batch
  // run does not, which is the whole point of having a command line.
  const result = await readGeoData(
    basename(inputPath),
    new Uint8Array(await readFile(inputPath)),
  );
  if (!result.ok) throw new UserError(result.error);
  const { input, vertexCount, skipped } = result;

  if (skipped)
    log(`Skipped ${formatInteger(skipped)} feature(s) that are not areal.`);
  log(
    `Read ${formatInteger(input.data.multiPolygons.length)} feature(s), ${formatInteger(vertexCount)} vertices, ${formatCrs(input.crs)}.`,
  );

  // Resolved before the run, so an output that cannot be written fails in a
  // moment rather than after a schematization that then has nowhere to go.
  const outputFormat = outputFormatOf(extname(outputPath));
  if (!outputFormat)
    throw new UserError(
      `Unsupported output format "${extname(outputPath) || outputPath}". Expected .gpkg, .fgb, .geojson or .svg.`,
    );
  if (outputFormat === "geojson" && !canExportGeoJson(input.crs))
    throw new UserError(
      `Cannot write GeoJSON for data in ${formatCrs(input.crs)}: RFC 7946 requires WGS84. Write .gpkg or .fgb instead, which keep the CRS.`,
    );

  // The simplification reports a step per edge move, so the steps are counted
  // per stage and only flushed when the stage changes.
  let stage: { label: string; steps: number } | undefined;
  const flushStage = (label?: string) => {
    if (stage && stage.label !== label)
      log(
        `  ${stage.label} (${formatInteger(stage.steps)} step${stage.steps === 1 ? "" : "s"})`,
      );
    if (label === undefined) return;
    stage =
      stage?.label === label
        ? { label, steps: stage.steps + 1 }
        : { label, steps: 1 };
  };

  const schematization = new CSchematization(
    { ...defaultStyle, k: options.k, c },
    {
      // Only the label is reported; building a Snapshot per step is the
      // expensive part of the worker, and there is no timeline to feed here.
      visualize: ({ label }) => flushStage(label),
    },
  );

  const dcel = input.getDcel();
  if (options.lambda !== undefined)
    schematization.setEpsilon(dcel, options.lambda);
  const schematized = schematization.run(dcel, options.maxIterations);
  flushStage();
  const subdivision = schematized.toSubdivision();

  await writeFile(
    outputPath,
    await serializeSubdivision(subdivision, outputFormat, {
      crs: input.crs,
      layerName: options.layer,
    }),
  );
  log(
    `Wrote ${outputPath} (${formatInteger(subdivision.vertexCount)} vertices).`,
  );
};

program
  .action(main)
  .parseAsync()
  .catch((error: unknown) => {
    // Prefixed as commander prefixes its own, so every failure reads the same.
    program.error(
      `error: ${
        error instanceof UserError
          ? error.message
          : `schematization failed: ${error instanceof Error ? error.message : String(error)}`
      }`,
    );
  });
