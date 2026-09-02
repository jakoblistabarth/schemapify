#!/usr/bin/env node --experimental-strip-types
// Regenerate test fixtures from remote data sources.
//
// Everything runs through node: DuckDB's spatial extension bundles GDAL, so it
// reads and writes GeoPackage and FlatGeobuf without a system GDAL install,
// and mapshaper ships as a library. No duckdb CLI, no ogr2ogr.

// GeoPackage records a last_change timestamp; pin it so reruns stay
// byte-identical instead of churning the diff. GDAL reads this from the
// environment, so it has to be set before the spatial extension loads.
const pinnedDate = "2026-01-01T00:00:00.000Z";
process.env.OGR_CURRENT_DATE = pinnedDate;

import { DuckDBInstance, type DuckDBConnection } from "@duckdb/node-api";
import { mkdir, readdir, readFile, writeFile } from "fs/promises";
import mapshaper from "mapshaper";
import { basename, dirname, join } from "path";
import initSqlJs from "sql.js";
import { fileURLToPath } from "url";

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const root = join(scriptsDir, "../../..");

/** The percentages the full-resolution sources are simplified to. */
const simplifyPercentages = ["0.01", ".05", ".1"];

/**
 * The committed reader fixtures, built from the GeoJSON next to them rather
 * than from a remote source, so the specs have stable inputs.
 *
 * `hasFid` marks a source whose features carry ids: GDAL exposes those as the
 * reserved OGC_FID column, which cannot be written back as a regular field.
 */
const fixtures = [
  { source: "test/data/shapes/square.json", name: "square" },
  {
    source: "test/data/geodata/AUT_adm1-simple.json",
    name: "AUT_adm1-simple",
    hasFid: true,
  },
  // Austria Lambert, so the readers are exercised on a projected CRS.
  // The two formats are compared vertex-for-vertex, so they must stay in sync.
  {
    source: "test/data/geodata/AUT_adm1-simple.json",
    name: "AUT_adm1-31287",
    hasFid: true,
    srs: "EPSG:31287",
  },
];

/** The formats each fixture is written in, as directory name to GDAL driver. */
const drivers = { gpkg: "GPKG", fgb: "FlatGeobuf" };

/**
 * Run a `.sql` file from this directory.
 *
 * The queries live in their own files rather than inline strings, so they keep
 * syntax highlighting and formatting.
 * @param connection an open DuckDB connection
 * @param name file name of the script, relative to this directory
 */
const runSqlFile = async (connection: DuckDBConnection, name: string) => {
  console.log(`→ ${name}`);
  const sql = await readFile(join(scriptsDir, name), "utf8");
  await connection.run(sql);
};

/**
 * Derive a topology-aware simplified variant.
 *
 * DuckDB's ST_SimplifyPreserveTopology only preserves topology within a single
 * geometry, which would crack shared borders apart; mapshaper simplifies across
 * features, so it stays.
 * @param name stem of the source in `test/data/generated`
 * @param percent simplification percentage, as mapshaper spells it
 */
const simplify = async (name: string, percent: string) => {
  const source = `test/data/generated/${name}.gpkg`;
  const out = `test/data/simplified/${name}-s${percent}.gpkg`;
  console.log(`→ ${out}`);
  await mapshaper.runCommands(
    `-i ${source} -simplify ${percent}% keep-shapes -clean -o ${out}`,
  );
  await pinLastChange(out);
};

/**
 * Pin a GeoPackage's `last_change` timestamp.
 *
 * mapshaper writes GeoPackages itself and stamps them with the current time,
 * ignoring OGR_CURRENT_DATE, which reaches GDAL only. Since these files are
 * committed, that would churn the diff on every run.
 * @param path the GeoPackage to rewrite in place
 */
const pinLastChange = async (path: string) => {
  const SQL = await initSqlJs();
  const db = new SQL.Database(new Uint8Array(await readFile(path)));
  db.run("UPDATE gpkg_contents SET last_change = ?", [pinnedDate]);
  const bytes = db.export();
  db.close();
  await writeFile(path, bytes);
};

/**
 * The statement writing one fixture in one format.
 *
 * The layer name is taken from the output file's stem, and GDAL pins the
 * GeoPackage timestamp from OGR_CURRENT_DATE, so reruns stay byte-identical.
 * @param fixture the fixture to write
 * @param out path to write to, whose extension selects the format
 * @param driver the GDAL driver to write with
 */
const fixtureSql = (
  fixture: (typeof fixtures)[number],
  out: string,
  driver: string,
) => {
  const { source, hasFid, srs } = fixture;
  const exclude = hasFid ? " EXCLUDE (OGC_FID)" : "";
  // GeoJSON is WGS84 by definition, so only the projected variants transform.
  const geom = srs
    ? ` REPLACE(ST_Transform(geom, 'EPSG:4326', '${srs}', always_xy := true) AS geom)`
    : "";
  return `COPY (SELECT *${exclude}${geom} FROM ST_Read('${source}'))
    TO '${out}' WITH (FORMAT gdal, DRIVER '${driver}', SRS '${srs ?? "EPSG:4326"}');`;
};

/**
 * The build stages, in the order they run.
 *
 * Named so a subset can be rebuilt: `overture` scans a few GB off S3, which is
 * not worth repeating when only the local fixtures changed.
 */
const stages = {
  overture: (connection: DuckDBConnection) =>
    runSqlFile(connection, "overture-adm.sql"),
  simplify: async () => {
    const sources = (await readdir("test/data/generated"))
      .filter((d) => d.endsWith(".gpkg"))
      .sort();
    for (const source of sources)
      for (const percent of simplifyPercentages)
        await simplify(basename(source, ".gpkg"), percent);
  },
  fixtures: async (connection: DuckDBConnection) => {
    for (const fixture of fixtures)
      for (const [format, driver] of Object.entries(drivers)) {
        const out = `test/data/${format}/${fixture.name}.${format}`;
        console.log(`→ ${out}`);
        await connection.run(fixtureSql(fixture, out, driver));
      }
  },
};

type Stage = keyof typeof stages;

const names = Object.keys(stages) as Stage[];

const build = async (requested: Stage[]) => {
  process.chdir(root);
  await Promise.all(
    [
      "test/data/generated",
      "test/data/simplified",
      "test/data/gpkg",
      "test/data/fgb",
    ].map((d) => mkdir(d, { recursive: true })),
  );

  const instance = await DuckDBInstance.create();
  const connection = await instance.connect();
  // Loaded on the connection rather than per script, so every stage has them:
  // spatial brings the GDAL reader and writer, httpfs the S3 access.
  await connection.run(
    "INSTALL spatial; LOAD spatial; INSTALL httpfs; LOAD httpfs;",
  );

  // Always in declaration order, so a later stage never runs on what an
  // earlier one has yet to write, whatever order the arguments came in.
  for (const stage of names.filter((d) => requested.includes(d)))
    await stages[stage](connection);

  connection.closeSync();
  instance.closeSync();
};

const requested = process.argv.slice(2) as Stage[];
const unknown = requested.filter((d) => !names.includes(d));
if (unknown.length) {
  console.error(
    `Unknown stage(s): ${unknown.join(", ")}. Available: ${names.join(", ")}.`,
  );
  process.exit(1);
}

build(requested.length ? requested : names).catch((error) => {
  console.error(error);
  process.exit(1);
});
