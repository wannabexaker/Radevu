import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const envPath = path.join(rootDir, "infra", ".env");
const command = process.argv[2];
const allowedCommands = new Set([
  "generate",
  "migrate:deploy",
  "migrate:dev",
  "seed",
  "seed:e2e"
]);

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

    if (key) {
      env[key] = value;
    }
  }

  return env;
}

function localDatabaseUrl(env) {
  const db = env.POSTGRES_DB || "radevu";
  const user = env.POSTGRES_USER || "radevu";
  const password = encodeURIComponent(
    env.POSTGRES_PASSWORD || "radevu_dev_password"
  );

  return `postgresql://${user}:${password}@localhost:5433/${db}?schema=public`;
}

if (!allowedCommands.has(command)) {
  console.error(
    `Usage: node scripts/db-local.mjs ${[...allowedCommands].join("|")}`
  );
  process.exit(1);
}

const loadedEnv = loadInfraEnv();
const pnpmRunner =
  process.platform === "win32"
    ? { command: "corepack", args: ["pnpm"] }
    : { command: "pnpm", args: [] };
const child = spawn(
  pnpmRunner.command,
  [...pnpmRunner.args, "--filter", "@radevu/db", command],
  {
  cwd: rootDir,
  env: {
    ...process.env,
    ...loadedEnv,
    DATABASE_URL: localDatabaseUrl(loadedEnv)
  },
  shell: process.platform === "win32",
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
