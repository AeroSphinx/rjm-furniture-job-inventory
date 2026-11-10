import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // eslint-config-next bundles jsx-a11y but does not promise "error" severity
  // on every rule; Requirement 24.2 wants the lint step to fail the build on
  // an accessibility violation, so the recommended ruleset is applied again
  // here with every rule forced to "error".
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: Object.fromEntries(
      Object.keys(jsxA11y.configs.recommended.rules).map((rule) => [rule, "error"]),
    ),
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
