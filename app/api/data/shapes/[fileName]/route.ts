import getTestFiles from "@/app/helpers/getTestFiles";
import { readFileSync } from "fs";

export const dynamic = "force-static";

/**
 * One exported file per fixture.
 *
 * The names carry their own extension, so the static export writes e.g.
 * `out/api/data/shapes/square.json` and `out/api/data/shapes/square.gpkg`.
 */
export const generateStaticParams = () =>
  getTestFiles().map(({ name }) => ({ fileName: name }));

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ fileName: string }>;
  },
) {
  const { fileName } = await params;
  const file = getTestFiles().find((d) => d.name === fileName);
  // Unreachable: the params come from this same listing. Throwing turns a
  // vanished fixture into a build failure rather than a 200 with an error body.
  if (!file) throw new Error(`No fixture named "${fileName}"`);
  // Served as bytes rather than parsed JSON, so binary formats work too.
  return new Response(readFileSync(file.path));
}
