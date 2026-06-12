import { execFileSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const rootDir = new URL("../..", import.meta.url).pathname;
const chatwootDir = join(rootDir, ".local", "integrations", "chatwoot");
const dockerPath = findDocker();

if (!existsSync(join(chatwootDir, "docker-compose.yaml")) || !existsSync(join(chatwootDir, ".env"))) {
  console.error("[error] Chatwoot config is missing. Run npm run integrations:install first.");
  process.exit(1);
}

if (!dockerPath) {
  console.error("[error] Docker CLI is missing. Install and start Docker Desktop first.");
  process.exit(1);
}

run(["compose", "run", "--rm", "rails", "bundle", "exec", "rails", "db:chatwoot_prepare"]);
run(["compose", "up", "-d"]);

function run(args) {
  const result = spawnSync(dockerPath, args, {
    cwd: chatwootDir,
    stdio: "inherit"
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function commandPath(command) {
  try {
    return execFileSync("sh", ["-lc", `command -v ${command}`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
  } catch {
    return null;
  }
}

function commandOutput(command, args) {
  try {
    return execFileSync(command, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
  } catch {
    return null;
  }
}

function findDocker() {
  return commandPath("docker") ?? appBundleDocker();
}

function appBundleDocker() {
  const path = "/Applications/Docker.app/Contents/Resources/bin/docker";
  const version = commandOutput(path, ["--version"]);

  return version ? path : null;
}
