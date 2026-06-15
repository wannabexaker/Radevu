import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const rootDir = path.resolve(appDir, "../..");
const envPath = path.join(rootDir, "infra", ".env");
const require = createRequire(import.meta.url);

function loadInfraEnv() {
  if (!existsSync(envPath)) {
    return {};
  }

  const env = {};
  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");

    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();

    if (key && key !== "NODE_ENV") {
      env[key] = value;
    }
  }

  return env;
}

const loadedEnv = loadInfraEnv();
const databaseUrl = loadedEnv.DATABASE_URL;

if (databaseUrl?.includes("@localhost:5432/")) {
  loadedEnv.DATABASE_URL = databaseUrl.replace("@localhost:5432/", "@localhost:5433/");
}

const nextBin = require.resolve("next/dist/bin/next");
const child = spawn(
  process.execPath,
  [nextBin, "dev", "--port", "3000", "--hostname", "0.0.0.0"],
  {
    cwd: appDir,
    env: {
      ...process.env,
      ...loadedEnv,
      DISABLE_REMINDER_WORKER: "1"
    },
    stdio: "inherit"
  }
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
