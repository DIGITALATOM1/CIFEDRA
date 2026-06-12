import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const rootDir = new URL("../..", import.meta.url).pathname;
const planeDir = join(rootDir, ".local", "integrations", "plane-selfhost");
const setupPath = join(planeDir, "setup.sh");
const envPath = join(planeDir, "plane-app", "plane.env");
const dockerPath = findDocker();

if (!existsSync(setupPath)) {
  console.error("[error] Plane setup.sh is missing. Run npm run integrations:install first.");
  process.exit(1);
}

if (!dockerPath) {
  console.error("[error] Docker CLI is missing. Install and start Docker Desktop first.");
  process.exit(1);
}

patchPlaneSetupScript();
runSetup("install");
configurePlaneEnv();

console.log("[ok] Plane install files are ready.");
console.log("[next] Run npm run integrations:plane:start and open http://localhost:8082.");

function runSetup(action) {
  const result = spawnSync("./setup.sh", [action], {
    cwd: planeDir,
    env: dockerEnv(),
    stdio: "inherit"
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function configurePlaneEnv() {
  if (!existsSync(envPath)) {
    console.error(`[error] Plane env file was not created: ${envPath}`);
    process.exit(1);
  }

  let content = readFileSync(envPath, "utf8");
  content = setEnvValue(content, "LISTEN_HTTP_PORT", "8082");
  content = setEnvValue(content, "LISTEN_HTTPS_PORT", "8443");
  content = setEnvValue(content, "WEB_URL", "http://localhost:8082");
  content = setEnvValue(
    content,
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:8082,http://localhost:4177,http://localhost:3030"
  );
  writeFileSync(envPath, content);
}

function patchPlaneSetupScript() {
  let content = readFileSync(setupPath, "utf8");
  const original =
    'grep -o \'"tag_name": "[^"]*"\' | sed \'s/"tag_name": "//;s/"//g\'';
  const replacement =
    'grep -o \'"tag_name"[[:space:]]*:[[:space:]]*"[^"]*"\' | sed \'s/.*"tag_name"[[:space:]]*:[[:space:]]*"//;s/"//g\'';

  if (content.includes(original)) {
    content = content.replace(original, replacement);
    writeFileSync(setupPath, content);
  }
}

function dockerEnv() {
  const dockerBinDir = dockerPath.slice(0, dockerPath.lastIndexOf("/"));

  return {
    ...process.env,
    PATH: `${dockerBinDir}:${process.env.PATH ?? ""}`
  };
}

function setEnvValue(content, key, value) {
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^#?${escapeRegExp(key)}=.*$`, "m");

  if (pattern.test(content)) {
    return content.replace(pattern, line);
  }

  return `${content.trimEnd()}\n${line}\n`;
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
