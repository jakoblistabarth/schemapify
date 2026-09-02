/**
 * The path the app is served under. Empty during `next dev`.
 */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * Prefix a root-relative URL with the {@link basePath}.
 *
 * Next rewrites `next/link` hrefs and `_next` asset URLs itself; this is for
 * the URLs we build by hand.
 * @param path a root-relative path, e.g. `/sql-wasm.wasm`
 */
export const withBasePath = (path: string) => `${basePath}${path}`;
