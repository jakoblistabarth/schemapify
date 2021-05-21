import { readdirSync } from "fs";

export function getTestFiles(dir) {
  const filesInDir = readdirSync(dir, function (err, files) {
    if (err) {
      return console.log("Unable to scan directory: " + err);
    }
    return files;
  });

  return filesInDir.filter((f) => f.substr(-5, f.length) === ".json");
}
