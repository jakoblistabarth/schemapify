import { readdirSync, statSync } from "fs";
import { resolve } from "path";
import prettyBytes from "pretty-bytes";
import { shapeSource, type SampleFile } from "./sampleFile";

/** A sample plus its location on the build machine. Never hand this to the client. */
export type TestFile = SampleFile & { path: string };

/** The formats the app can read, and therefore the ones worth offering. */
const supported = /\.(json|fgb|gpkg)$/;

/** Directories under `test/data` whose contents are not worth offering. */
const excludedDirs = ["scripts", "invalid", "geodata", "gpkg", "fgb"];

/** Narrows a directory to matching files: the full-resolution sources next to the simplified variants in `generated` are too detailed to schematize. */
const includedFiles: Record<string, RegExp> = {
  generated: /-s[\d.]+\.gpkg$/,
};

/**
 * Enumerate the bundled fixtures.
 *
 * Runs at build time only: it reads `test/data` from disk, and its result both
 * populates the file select and drives the route handler's static params.
 */
const getTestFiles = () => {
  const baseDir = resolve("./test/data");
  const subDirs = readdirSync(baseDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !excludedDirs.includes(d.name))
    .map((d) => d.name);
  const files = subDirs.flatMap((subDir) => {
    const filesInDir = readdirSync(`${baseDir}/${subDir}`)
      .filter(
        (d) => supported.test(d) && (includedFiles[subDir]?.test(d) ?? true),
      )
      .map((d) => {
        const path = `${baseDir}/${subDir}/${d}`;
        const { size } = statSync(path);
        const file: TestFile = {
          ...shapeSource(d),
          path,
          type: subDir,
          size: prettyBytes(size),
        };
        return file;
      });
    return filesInDir;
  });
  return files;
};

/** The fixtures, stripped of build-machine paths so they can cross to the client. */
export const getSampleFiles = (): SampleFile[] =>
  getTestFiles().map(({ name, url, type, size }) => ({
    name,
    url,
    type,
    size,
  }));

export default getTestFiles;
