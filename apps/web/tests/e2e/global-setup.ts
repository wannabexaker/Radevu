import { execFileSync } from "node:child_process";
import path from "node:path";

// Seeds the e2e-only `qa-demo` fixture before the Playwright suite runs. The
// production seed (packages/db/prisma/seed.ts) no longer creates this business,
// so the specs rely on this fixture for the owner account and `qa-demo` slug.
// Playwright transpiles this file as CommonJS, so use __dirname (matching the
// spec files) rather than import.meta.url.
const repoRoot = path.resolve(__dirname, "..", "..", "..", "..");
const dbLocalScript = path.join(repoRoot, "scripts", "db-local.mjs");

export default function globalSetup(): void {
  execFileSync(process.execPath, [dbLocalScript, "seed:e2e"], {
    cwd: repoRoot,
    stdio: "inherit"
  });
}
