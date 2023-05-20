import getTestFiles, { TestFile } from "./getTestFiles";

const getGroupedTestFiles = async () => {
  const files = await getTestFiles();
  const filesGrouped = files
    ?.filter((d) => d.type != "invalid")
    .reduce((acc: { [key: string]: TestFile[] }, d) => {
      if (acc[d.type]) {
        acc[d.type].push(d);
        return acc;
      }
      acc[d.type] = [d];
      return acc;
    }, {});
  return filesGrouped;
};

export default getGroupedTestFiles;

export type GroupedTestFiles = Awaited<ReturnType<typeof getGroupedTestFiles>>;
