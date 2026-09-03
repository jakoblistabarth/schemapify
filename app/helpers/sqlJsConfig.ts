import { withBasePath } from "./basePath";

/**
 * sql.js resolves its wasm relative to the page, which fails in the browser.
 * `pnpm assets` copies the file into `public/`.
 */
const sqlJsConfig = { locateFile: () => withBasePath("/sql-wasm.wasm") };

export default sqlJsConfig;
