/**
 * A bundled data sample, as handed to the browser.
 *
 * Deliberately free of build-machine paths, so it can be serialized from a
 * server component into client props.
 */
export type SampleFile = {
  name: string;
  /** Root-relative URL the browser fetches the sample from, without the base path. */
  url: string;
  /** The group the sample is listed under, i.e. the directory it lives in. */
  type: string;
  size: string;
};

/** The minimum needed to load a sample. */
export type SourceRef = Pick<SampleFile, "name" | "url">;

/**
 * Reference a fixture by name.
 *
 * Fixtures are served by the route handler, which is prerendered into one file
 * per fixture by the static export.
 * @param name the file name, including its extension
 */
export const shapeSource = (name: string): SourceRef => ({
  name,
  url: `/api/data/shapes/${name}`,
});
