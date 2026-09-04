import { geoPackageToGeometry } from "@/src/Input/geoPackage";
import { execFile } from "child_process";
import { mkdtempSync, readFileSync, rmSync } from "fs";
import * as geojson from "geojson";
import { tmpdir } from "os";
import path from "path";
import { promisify } from "util";
import { afterAll, describe, expect, test } from "vitest";

const run = promisify(execFile);

const outDir = mkdtempSync(path.join(tmpdir(), "schemapify-cli-"));
afterAll(() => rmSync(outDir, { recursive: true, force: true }));

/**
 * Run the CLI the way `pnpm schematize` does.
 * @param args the command line arguments
 * @returns the process' streams, or its error when it exits non-zero
 */
const schematize = (args: string[]) =>
  run("./node_modules/.bin/tsx", ["cli/schematize.ts", ...args, "--quiet"]);

/** The CLI spawns a process and runs the full algorithm, so it is not quick. */
const timeout = 120_000;

describe("The schematize CLI", () => {
  test(
    "writes a schematized FeatureCollection for GeoJSON input.",
    async () => {
      const output = path.join(outDir, "aut.geojson");
      await schematize([
        "test/data/geodata/AUT_adm1-simple.json",
        "-o",
        output,
      ]);

      const result = JSON.parse(
        readFileSync(output, "utf8"),
      ) as geojson.FeatureCollection<geojson.MultiPolygon>;

      expect(result.type).toBe("FeatureCollection");
      expect(result.features.length).toBe(9);
      for (const feature of result.features)
        expect(feature.geometry.coordinates.length).toBeGreaterThan(0);
    },
    timeout,
  );

  test(
    "keeps a projected CRS when writing a GeoPackage.",
    async () => {
      const output = path.join(outDir, "aut.gpkg");
      await schematize(["test/data/gpkg/AUT_adm1-31287.gpkg", "-o", output]);

      const { data, crs } = await geoPackageToGeometry(
        new Uint8Array(readFileSync(output)),
      );

      expect(crs?.code).toBe(31287);
      expect(data.multiPolygons.length).toBe(9);
    },
    timeout,
  );

  test(
    "refuses to write GeoJSON for projected data.",
    async () => {
      const output = path.join(outDir, "refused.geojson");

      await expect(
        schematize(["test/data/gpkg/AUT_adm1-31287.gpkg", "-o", output]),
      ).rejects.toMatchObject({
        code: 1,
        stderr: expect.stringContaining("RFC 7946 requires WGS84"),
      });
    },
    timeout,
  );

  test(
    "schematizes to an irregular C.",
    async () => {
      const output = path.join(outDir, "irregular.svg");
      await schematize([
        "test/data/geodata/AUT_adm1-simple.json",
        "--angles",
        "0,45,90,135",
        "-o",
        output,
      ]);

      expect(readFileSync(output, "utf8")).toContain("<svg");
    },
    timeout,
  );

  test(
    "says why the simplification stopped, when the target is out of reach.",
    async () => {
      const { stderr } = await run("./node_modules/.bin/tsx", [
        "cli/schematize.ts",
        "test/data/geodata/AUT_adm1-simple.json",
        "-o",
        path.join(outDir, "outcome.svg"),
      ]);

      // The default k of 8 is far below what the edge moves can reach, which has to
      // read as the run running out rather than as -k being ignored.
      expect(stderr).toContain("ran out of feasible edge moves");
      expect(stderr).toContain("short of the 8 asked for");
    },
    timeout,
  );

  test(
    "counts k in edges rather than in half-edges.",
    async () => {
      const output = path.join(outDir, "k.geojson");
      const { stderr } = await run("./node_modules/.bin/tsx", [
        "cli/schematize.ts",
        "test/data/geodata/AUT_adm1-simple.json",
        "-o",
        output,
        "-k",
        "100",
      ]);

      // Stopping just under k is what counting in edges looks like; counting the two
      // half-edges the Dcel holds per edge would carry on to about half of it.
      const edges = Number(/Simplified to ([\d,]+) edge/.exec(stderr)?.[1]);
      expect(edges).toBeLessThan(100);
      expect(edges).toBeGreaterThan(50);
      expect(stderr).toContain("reached the target number of edges");
    },
    timeout,
  );

  test(
    "rejects options that describe C twice over.",
    async () => {
      await expect(
        schematize([
          "test/data/geodata/AUT_adm1-simple.json",
          "--angles",
          "0,90",
          "-c",
          "4",
          "-o",
          path.join(outDir, "unused.svg"),
        ]),
      ).rejects.toMatchObject({
        code: 1,
        stderr: expect.stringContaining("cannot be used with option"),
      });
    },
    timeout,
  );

  test(
    "rejects a C it cannot schematize against, before reading the input.",
    async () => {
      await expect(
        schematize([
          "test/data/geodata/AUT_adm1-simple.json",
          "--angles",
          "45",
          "-o",
          path.join(outDir, "unused.svg"),
        ]),
      ).rejects.toMatchObject({
        code: 1,
        stderr: expect.stringContaining("at least 2 distinct orientations"),
      });
    },
    timeout,
  );
});
