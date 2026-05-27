// Installs project-local git hooks by pointing core.hooksPath at
// scripts/git-hooks. Runs automatically on `npm install` via the
// `prepare` script in package.json. No-op outside a git checkout
// (e.g. inside a CI tarball install).

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = join(here, "..");

if (!existsSync(join(repoRoot, ".git"))) {
  process.exit(0);
}

try {
  execSync("git config core.hooksPath scripts/git-hooks", {
    cwd: repoRoot,
    stdio: "ignore",
  });
} catch {
  // Non-fatal: hook install failed (no git in PATH, etc).
}
