import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vercel build artifacts (created locally by `vercel build`):
    ".vercel/**",
    // Vendored minified worker shipped by pdfjs-dist via postinstall:
    "public/pdf.worker.min.mjs",
    // Supabase Edge Functions run on Deno, not Node — different runtime,
    // different typings (remote https imports, Deno globals). Linting them
    // under the Next.js tsconfig is noise.
    "supabase/functions/**",
  ]),
]);

export default eslintConfig;
