import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // The CMS admin is deliberately a full-page-load tool: every screen is
    // server-rendered from the store on request, several links target API
    // routes (preview, logout), and soft navigation would keep stale editor
    // state alive. Plain anchors are the design there, not an oversight.
    files: ["src/app/admin/**", "src/components/admin/**"],
    rules: { "@next/next/no-html-link-for-pages": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    // Deploy artefact of scripts/build-release.sh: built code and vendored
    // dependencies, none of it ours to lint.
    "release/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
