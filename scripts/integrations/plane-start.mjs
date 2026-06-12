import { execFileSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const rootDir = new URL("../..", import.meta.url).pathname;
const planeDir = join(rootDir, ".local", "integrations", "plane-selfhost");
const setupPath = join(planeDir, "setup.sh");
const envPath = join(planeDir, "plane-app", "plane.env");
const dockerPath = findDocker();

if (!existsSync(setupPath) || !existsSync(envPath)) {
  console.error("[error] Plane install files are missing. Run npm run integrations:plane:install first.");
  process.exit(1);
}

if (!dockerPath) {
  console.error("[error] Docker CLI is missing. Install and start Docker Desktop first.");
  process.exit(1);
}

const result = spawnSync("./setup.sh", ["start"], {
  cwd: planeDir,
  env: dockerEnv(),
  stdio: "inherit"
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

function dockerEnv() {
  const dockerBinDir = dockerPath.slice(0, dockerPath.lastIndexOf("/"));

  return {
    ...process.env,
    PATH: `${dockerBinDir}:${process.env.PATH ?? ""}`
  };
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
