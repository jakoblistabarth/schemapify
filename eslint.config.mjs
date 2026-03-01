// @ts-check
import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  prettier,
  {
    settings: {
      // Pin React version to avoid eslint-plugin-react calling the removed
      // context.getFilename() API when detecting the version under ESLint 10.
      react: { version: "19" },
    },
    rules: {
      "padding-line-between-statements": [
        "warn",
        { blankLine: "always", prev: "import", next: "*" },
        { blankLine: "any", prev: "import", next: "import" },
      ],
    },
  },
]);

export default eslintConfig;
