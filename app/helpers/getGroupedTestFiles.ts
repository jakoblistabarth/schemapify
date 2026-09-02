import { getSampleFiles } from "./getTestFiles";
import { type SampleFile } from "./sampleFile";

/**
 * The samples offered in the file select, grouped by the directory they live in.
 */
const getGroupedTestFiles = () => {
  const files = getSampleFiles();
  const filesGrouped = files.reduce(
    (acc: { [key: string]: SampleFile[] }, d) => {
      if (acc[d.type]) {
        acc[d.type].push(d);
        return acc;
      }
      acc[d.type] = [d];
      return acc;
    },
    {},
  );
  return filesGrouped;
};

export default getGroupedTestFiles;

export type GroupedTestFiles = Awaited<ReturnType<typeof getGroupedTestFiles>>;
