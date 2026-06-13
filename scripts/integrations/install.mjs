import { execFileSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { randomBytes } from "node:crypto";

const rootDir = new URL("../..", import.meta.url).pathname;
const localDir = join(rootDir, ".local", "integrations");
const planeDir = join(localDir, "plane-selfhost");
const chatwootDir = join(localDir, "chatwoot");

mkdirSync(localDir, {
  recursive: true
});

const dockerPath = findDocker();
const dockerAvailable = Boolean(dockerPath);
const dockerEngineRunning = dockerPath
  ? Boolean(commandOutput(dockerPath, ["info", "--format", "{{.ServerVersion}}"]))
  : false;

await preparePlane();
await prepareChatwoot();

if (!dockerAvailable) {
  console.log("[wait] Docker CLI is not installed. Docker Desktop must be installed and started first.");
  console.log("[next] Run npm run docker:install, finish Docker Desktop onboarding, then run npm run integrations:install again.");
  process.exitCode = 1;
} else if (!dockerEngineRunning) {
  console.log("[wait] Docker CLI is installed, but Docker Engine is not running.");
  console.log("[next] Open Docker Desktop and wait until it starts, then run npm run integrations:install again.");
  process.exitCode = 1;
} else {
  console.log("[ok] Integration install folders are ready.");
  console.log("[next] Plane uses its official interactive setup script in .local/integrations/plane-selfhost/setup.sh.");
  console.log("[next] Chatwoot config is ready in .local/integrations/chatwoot; run npm run integrations:chatwoot:start to pull images and start it.");
}

async function preparePlane() {
  mkdirSync(planeDir, {
    recursive: true
  });

  const setupPath = join(planeDir, "setup.sh");

  if (!existsSync(setupPath)) {
    await download(
      "https://github.com/makeplane/plane/releases/latest/download/setup.sh",
      setupPath
    );
    chmodSync(setupPath, 0o755);
  }

  console.log(`[ok] Plane installer prepared: ${setupPath}`);
}

async function prepareChatwoot() {
  mkdirSync(chatwootDir, {
    recursive: true
  });

  const envPath = join(chatwootDir, ".env");
  const composePath = join(chatwootDir, "docker-compose.yaml");

  if (!existsSync(envPath)) {
    await download("https://raw.githubusercontent.com/chatwoot/chatwoot/develop/.env.example", envPath);
  }

  if (!existsSync(composePath)) {
    await download(
      "https://raw.githubusercontent.com/chatwoot/chatwoot/develop/docker-compose.production.yaml",
      composePath
    );
  }

  configureChatwootEnv(envPath);
  configureChatwootCompose(composePath);

  console.log(`[ok] Chatwoot config prepared: ${chatwootDir}`);
}

function configureChatwootEnv(envPath) {
  let content = readFileSync(envPath, "utf8");

  content = setEnvValue(content, "FRONTEND_URL", "http://localhost:8083");
  content = setEnvValue(content, "SECRET_KEY_BASE", existingOrHex(content, "SECRET_KEY_BASE", 64));
  content = setEnvValue(content, "POSTGRES_PASSWORD", existingOrPassword(content, "POSTGRES_PASSWORD"));
  content = setEnvValue(content, "REDIS_PASSWORD", existingOrPassword(content, "REDIS_PASSWORD"));
  content = setEnvValue(content, "RAILS_ENV", "production");
  content = setEnvValue(content, "NODE_ENV", "production");
  content = setEnvValue(content, "INSTALLATION_ENV", "docker");

  writeFileSync(envPath, content);
}

function configureChatwootCompose(composePath) {
  let content = readFileSync(composePath, "utf8");

  content = content.replaceAll("127.0.0.1:3000:3000", "127.0.0.1:8083:3000");
  content = content.replaceAll("3000:3000", "127.0.0.1:8083:3000");
  content = content.replace(
    /^(\s*-\s*POSTGRES_PASSWORD=).*$/m,
    "$1${POSTGRES_PASSWORD}"
  );
  content = content.replace(/^version:\s*['"]?\d(?:\.\d+)?['"]?\n\n?/m, "");

  writeFileSync(composePath, content);
}

function setEnvValue(content, key, value) {
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^#?${escapeRegExp(key)}=.*$`, "m");

  if (pattern.test(content)) {
    return content.replace(pattern, line);
  }

  return `${content.trimEnd()}\n${line}\n`;
}

function existingOrHex(content, key, byteLength) {
  const value = getEnvValue(content, key);

  if (value) {
    return value;
  }

  return randomBytes(byteLength).toString("hex");
}

function existingOrPassword(content, key) {
  const value = getEnvValue(content, key);

  if (value) {
    return value;
  }

  return `cifedra${randomBytes(24).toString("hex")}`;
}

function getEnvValue(content, key) {
  const pattern = new RegExp(`^#?${escapeRegExp(key)}=(.*)$`, "m");
  const match = content.match(pattern);

  return match?.[1]?.trim() ?? "";
}

async function download(url, outputPath) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(outputPath, buffer);
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

function findDocker() {
  return commandPath("docker") ?? appBundleDocker();
}

function appBundleDocker() {
  const path = "/Applications/Docker.app/Contents/Resources/bin/docker";
  const version = commandOutput(path, ["--version"]);

  return version ? path : null;
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
