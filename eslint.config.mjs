import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Production build used only by the E2E suite (VITA_DIST_DIR, see playwright.config.ts).
    ".next-e2e/**",
    // Zepp OS mini-app build output and dependencies (relogio/.gitignore).
    "relogio/dist/**",
    "relogio/node_modules/**",
  ]),
]);

export default eslintConfig;
