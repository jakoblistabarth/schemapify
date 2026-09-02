/** Mapshaper ships no type declarations; this covers the surface the build script uses. */
declare module "mapshaper" {
  /**
   * Run a mapshaper command string, as it would be typed on the command line.
   * @param commands the command string, e.g. `-i in.gpkg -simplify 10% -o out.gpkg`
   */
  export function runCommands(commands: string): Promise<void>;

  const mapshaper: { runCommands: typeof runCommands };
  export default mapshaper;
}
