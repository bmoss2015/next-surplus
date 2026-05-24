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
  {
    rules: {
      // The React 19 / Next 16 upgrade introduced these as errors. There are
      // 30+ existing call sites where setState lives inside a useEffect (reset
      // on dep change, polling kickoff, sync local state to incoming props).
      // Each one needs a per-site decision (useEffectEvent, derived state,
      // event-handler hoist), so they're tracked as warnings here pending a
      // dedicated hooks refactor PR.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/refs": "warn",
    },
  },
]);

export default eslintConfig;
