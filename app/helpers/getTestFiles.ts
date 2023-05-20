import { readdirSync, statSync } from "fs";
import { resolve } from "path";
import prettyBytes from "pretty-bytes";

export type TestFile = {
  name: string;
  path: string;
  type: string;
  size: string;
};

const getTestFiles = () => {
  const baseDir = resolve("./test/data");
  const subDirs = readdirSync(baseDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  const files = subDirs.flatMap((subDir) => {
    const filesInDir = readdirSync(`${baseDir}/${subDir}`)
      .filter((d) => /.json$/.test(d))
      .map((d) => {
        const path = `${baseDir}/${subDir}/${d}`;
        const { size } = statSync(path);
        const file: TestFile = {
          name: d,
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

export default getTestFiles;
